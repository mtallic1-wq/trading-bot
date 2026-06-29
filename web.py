"""
NQ/ES NYSE Bias Bot — Web Dashboard & Signal Delivery Backend
Start: python web.py
Opens at: http://localhost:8080
"""
import hmac
import hashlib
import json
import os
import threading
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from flask import Flask, jsonify, send_from_directory, abort, request
from apscheduler.schedulers.background import BackgroundScheduler
import pytz

from config import REPORTS_DIR, BASE_DIR
from storage.database import (
    init_db, register_user, get_user_by_email, get_user_by_token,
    update_user_settings, update_user_subscription, log_delivery,
    check_delivery_logged, get_all_users
)

STATIC_DIR = BASE_DIR / "static"
app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="")

# Initialize Database Schema on load
init_db()

# ── Background job store ──────────────────────────────────────────────────────
_jobs = {}   # job_id -> {"status": "running"|"done"|"error", "result": ..., "error": ...}


def _run_job(job_id, fn, *args):
    try:
        result = fn(*args)
        _jobs[job_id] = {"status": "done", "result": result}
    except Exception as e:
        _jobs[job_id] = {"status": "error", "error": str(e)}


def _start_job(fn, *args):
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {"status": "running"}
    t = threading.Thread(target=_run_job, args=(job_id, fn) + args, daemon=True)
    t.start()
    return job_id


# ── Scheduler & Signal Delivery Worker ────────────────────────────────────────

def check_and_send_scheduled_reports():
    """Runs every minute to check if any active user needs pre-market signals."""
    users = get_all_users()
    if not users:
        return
        
    from bot import TradingBot
    from delivery import (
        format_report_html, format_report_whatsapp,
        send_email_via_brevo, send_whatsapp_via_twilio
    )
    from storage.store import load_report

    now_utc = datetime.now(pytz.utc)
    report_cache = {}

    for user in users:
        # Deliver to active paid subscribers
        if user["subscription_status"] != "active":
            continue

        try:
            user_tz = pytz.timezone(user["timezone"])
        except Exception:
            user_tz = pytz.timezone("America/New_York")

        now_user = now_utc.astimezone(user_tz)
        user_time_str = now_user.strftime("%H:%M")

        # If user's preferred local time matches the current minute
        if user_time_str == user["delivery_time"]:
            report_date = now_user.strftime("%Y-%m-%d")

            # Deliver Email
            if not check_delivery_logged(user["id"], report_date, "email"):
                if report_date not in report_cache:
                    report = load_report(report_date)
                    if not report:
                        bot = TradingBot()
                        try:
                            report = bot.run_analysis(report_date)
                        except Exception as e:
                            print(f"[Scheduler] Run analysis failed for {report_date}: {e}")
                            report = None
                    if report:
                        report_cache[report_date] = report
                
                if report_date in report_cache:
                    report = report_cache[report_date]
                    html_content = format_report_html(report)
                    subject = f"NQ Bias — {report_date} Pre-Market Report"
                    success = send_email_via_brevo(user["email"], subject, html_content)
                    log_delivery(
                        user["id"], report_date, "email",
                        "success" if success else "failed",
                        None if success else "Email transmission error"
                    )

            # Deliver WhatsApp if configured
            if user["whatsapp"] and not check_delivery_logged(user["id"], report_date, "whatsapp"):
                if report_date not in report_cache:
                    report = load_report(report_date)
                    if not report:
                        bot = TradingBot()
                        try:
                            report = bot.run_analysis(report_date)
                        except Exception as e:
                            print(f"[Scheduler] Run analysis failed for {report_date}: {e}")
                            report = None
                    if report:
                        report_cache[report_date] = report

                if report_date in report_cache:
                    report = report_cache[report_date]
                    text_content = format_report_whatsapp(report)
                    success = send_whatsapp_via_twilio(user["whatsapp"], text_content)
                    log_delivery(
                        user["id"], report_date, "whatsapp",
                        "success" if success else "failed",
                        None if success else "WhatsApp transmission error"
                    )


# Start Scheduler
if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(check_and_send_scheduled_reports, "interval", minutes=1)
    scheduler.start()
    print("[Scheduler] Active background daemon running.")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(str(STATIC_DIR), "index.html")


# Reports listing
@app.route("/api/reports")
def list_reports_endpoint():
    files = sorted(REPORTS_DIR.glob("*.json"), reverse=True)
    return jsonify([f.stem for f in files])


# Report detail with 2-hour freemium delay
@app.route("/api/report/<date>")
def get_report(date):
    fp = REPORTS_DIR / f"{date}.json"
    if not fp.exists():
        abort(404, description=f"No report for {date}")
        
    report = json.loads(fp.read_text(encoding="utf-8"))

    # Check if a valid token for subscription access is provided
    token = request.args.get("token") or request.headers.get("Authorization")
    is_active_sub = False
    if token:
        user = get_user_by_token(token)
        if user and user["subscription_status"] == "active":
            is_active_sub = True

    # Limit today's report access on free tier
    created_str = report.get("created")
    if created_str and not is_active_sub:
        try:
            created_dt = datetime.fromisoformat(created_str)
            age_seconds = (datetime.now() - created_dt).total_seconds()
            # If report is less than 2 hours old, strip out actionable data
            if age_seconds < 7200:
                delayed_report = report.copy()
                delayed_report["side"] = "DELAYED"
                delayed_report["bias_nq"] = "DELAYED"
                delayed_report["playbook"] = {
                    "day_type": "DELAYED",
                    "risk_note": "Upgrade to paid tier ($10/mo) for real-time pre-market signals",
                    "active_strategies": [],
                    "key_levels": []
                }
                delayed_report["analysis"] = {
                    "analysis": "### 🔒 SIGNAL DELAYED\nPre-market analysis is delayed by 2 hours for the free tier. Please upgrade to a paid subscription for instant pre-market email & WhatsApp delivery.",
                    "bias_nq": "DELAYED",
                    "side": "DELAYED"
                }
                delayed_report["is_delayed"] = True
                return jsonify(delayed_report)
        except Exception:
            pass

    return jsonify(report)


# Trigger analysis
@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    date_str = data.get("date") or None
    from bot import TradingBot
    bot = TradingBot()
    job_id = _start_job(bot.run_analysis, date_str)
    return jsonify({"job_id": job_id})


# Poll job status
@app.route("/api/job/<job_id>")
def job_status(job_id):
    job = _jobs.get(job_id)
    if not job:
        abort(404, description="Unknown job")
    return jsonify(job)


# Live news
@app.route("/api/news")
def news():
    def _fetch():
        from scrapers.yahoo import get_all_yahoo_news
        from scrapers.tradingview import get_all_tradingview_data
        date_str = datetime.now().strftime("%Y-%m-%d")
        return {
            "fetched_at": datetime.now().isoformat(),
            "yahoo": get_all_yahoo_news(),
            "tradingview": get_all_tradingview_data(date_str),
        }
    job_id = _start_job(_fetch)
    return jsonify({"job_id": job_id})


# ── Onboarding & Settings Routes ──────────────────────────────────────────────

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if not email or "@" not in email:
        return jsonify({"success": False, "error": "Invalid email address"}), 400
        
    whatsapp = data.get("whatsapp")
    delivery_time = data.get("delivery_time", "08:30")
    timezone = data.get("timezone", "America/New_York")
    
    user = register_user(
        email=email,
        whatsapp=whatsapp,
        delivery_time=delivery_time,
        timezone=timezone,
        subscription_status="free"  # default to free tier until webhook processes payment
    )
    
    # Send a welcome onboarding email via Brevo if key configured
    from delivery import send_email_via_brevo
    portal_url = f"https://nqbiasbot.com/settings?token={user['token']}"
    welcome_html = f"""
    <h2>Welcome to NQ Bias Bot Alerts!</h2>
    <p>Thank you for signing up. You can manage your delivery preferences and update your timezone/time at any time using your personal portal link below:</p>
    <p><a href="{portal_url}" style="font-weight: bold; color: #4D9EFF;">Manage Notification Settings</a></p>
    <p>If you'd like to get real-time pre-market delivery via email and WhatsApp, make sure to upgrade to our premium tier!</p>
    """
    send_email_via_brevo(email, "Welcome to NQ Bias Bot!", welcome_html)
    
    return jsonify({
        "success": True,
        "token": user["token"],
        "user": {
            "email": user["email"],
            "whatsapp": user["whatsapp"],
            "delivery_time": user["delivery_time"],
            "timezone": user["timezone"],
            "subscription_status": user["subscription_status"]
        }
    })


@app.route("/api/user/settings", methods=["GET", "POST"])
def user_settings():
    token = request.args.get("token") or request.headers.get("Authorization")
    if not token:
        return jsonify({"success": False, "error": "Authentication token required"}), 401
        
    user = get_user_by_token(token)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
        
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        whatsapp = data.get("whatsapp", user["whatsapp"])
        delivery_time = data.get("delivery_time", user["delivery_time"])
        timezone = data.get("timezone", user["timezone"])
        
        success = update_user_settings(token, whatsapp, delivery_time, timezone)
        if success:
            user = get_user_by_token(token)  # reload updated row
            return jsonify({"success": True, "user": user})
        return jsonify({"success": False, "error": "Failed to update settings"}), 500
        
    return jsonify({"success": True, "user": user})


# ── Lemon Squeezy Webhook ─────────────────────────────────────────────────────

@app.route("/api/webhooks/lemonsqueezy", methods=["POST"])
def lemonsqueezy_webhook():
    secret = os.environ.get("LEMON_SQUEEZY_WEBHOOK_SECRET")
    signature = request.headers.get("X-Signature")
    
    # Verify webhook signature using HMAC-SHA256
    if secret:
        if not signature:
            return jsonify({"error": "Missing signature header"}), 401
        payload_data = request.get_data()
        local_sig = hmac.new(
            secret.encode("utf-8"),
            payload_data,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(local_sig, signature):
            return jsonify({"error": "Invalid signature"}), 401

    data = request.get_json(silent=True) or {}
    event_name = data.get("meta", {}).get("event_name")
    
    # Process events
    if event_name in ("subscription_created", "subscription_updated"):
        attrs = data.get("data", {}).get("attributes", {})
        email = attrs.get("user_email") or attrs.get("customer_email")
        if email:
            # Check subscription state
            status = attrs.get("status")  # 'active', 'on_trial', 'cancelled', etc.
            db_status = "active" if status in ("active", "on_trial") else "free"
            update_user_subscription(email, db_status)
            print(f"[Webhook] User {email} subscription state updated to {db_status}")
            
    elif event_name in ("subscription_cancelled", "subscription_expired"):
        attrs = data.get("data", {}).get("attributes", {})
        email = attrs.get("user_email") or attrs.get("customer_email")
        if email:
            update_user_subscription(email, "free")
            print(f"[Webhook] User {email} subscription state cancelled -> free tier")
            
    return jsonify({"success": True})


if __name__ == "__main__":
    STATIC_DIR.mkdir(exist_ok=True)
    port = int(os.environ.get("PORT", 8080))
    print(f"\n  NYSE Bias Bot — Web Dashboard")
    print(f"  http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
