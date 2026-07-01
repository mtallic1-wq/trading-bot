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
    check_delivery_logged, get_all_users, register_purchase, has_purchased_product
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
        format_report_html,
        send_email_via_brevo
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


@app.route("/wiki")
def wiki():
    return send_from_directory(str(STATIC_DIR), "wiki.html")


# Reports listing
@app.route("/api/reports")
def list_reports_endpoint():
    files = sorted(REPORTS_DIR.glob("*.json"), reverse=True)
    return jsonify([f.stem for f in files])


# Report detail
@app.route("/api/report/<date>")
def get_report(date):
    fp = REPORTS_DIR / f"{date}.json"
    if not fp.exists():
        abort(404, description=f"No report for {date}")
        
    report = json.loads(fp.read_text(encoding="utf-8"))
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


# Bias prediction performance metrics
@app.route("/api/bias/win-rate")
def get_bias_win_rate():
    files = sorted(REPORTS_DIR.glob("*.json"))
    predictions = {}
    actual_directions = {}

    for fp in files:
        try:
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            date = data.get("date")
            bias = data.get("bias_nq") or data.get("side")
            
            if date and bias:
                bias = bias.upper()
                if "BULL" in bias or "BUY" in bias:
                    bias_type = "BULLISH"
                elif "BEAR" in bias or "SELL" in bias:
                    bias_type = "BEARISH"
                else:
                    bias_type = "NEUTRAL"
                predictions[date] = bias_type

            # Extract actual candle directions
            candles = data.get("nq", {}).get("recent_candles", [])
            for c in candles:
                c_date = c.get("date")
                c_dir = c.get("direction")
                if c_date and c_dir:
                    actual_directions[c_date] = "BULLISH" if c_dir == "UP" else "BEARISH"
        except Exception as e:
            print(f"[Win Rate Error] failed parsing {fp.name}: {e}")

    correct = 0
    total = 0
    details = []

    for date, pred in sorted(predictions.items()):
        actual = actual_directions.get(date)
        # We only count active bullish/bearish biases that have completed
        if actual and pred != "NEUTRAL":
            is_correct = (pred == actual)
            if is_correct:
                correct += 1
            total += 1
            details.append({
                "date": date,
                "predicted": pred,
                "actual": actual,
                "result": "WIN" if is_correct else "LOSS"
            })

    # Sort details in reverse chronological order for table listing
    details = sorted(details, key=lambda x: x["date"], reverse=True)

    win_rate = round((correct / total * 100), 2) if total > 0 else 0.0
    
    # Calculate current streak
    streak_count = 0
    streak_type = None
    if details:
        streak_type = details[0]["result"]
        for d in details:
            if d["result"] == streak_type:
                streak_count += 1
            else:
                break
                
    return jsonify({
        "success": True,
        "total_evaluated": total,
        "correct_predictions": correct,
        "win_rate": win_rate,
        "streak_count": streak_count,
        "streak_type": streak_type,
        "details": details
    })


# ── Onboarding & Settings Routes ──────────────────────────────────────────────

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if not email or "@" not in email:
        return jsonify({"success": False, "error": "Invalid email address"}), 400
        
    delivery_time = data.get("delivery_time", "08:30")
    timezone = data.get("timezone", "America/New_York")
    
    user = register_user(
        email=email,
        whatsapp=None,
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
    <p>If you'd like to get real-time pre-market delivery via email, make sure to upgrade to our premium tier!</p>
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
            "subscription_status": user["subscription_status"],
            "has_playbook": False
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
        delivery_time = data.get("delivery_time", user["delivery_time"])
        timezone = data.get("timezone", user["timezone"])
        
        success = update_user_settings(token, None, delivery_time, timezone)
        if success:
            user = get_user_by_token(token)  # reload updated row
            
    user_data = {
        "email": user["email"],
        "whatsapp": user["whatsapp"],
        "delivery_time": user["delivery_time"],
        "timezone": user["timezone"],
        "subscription_status": user["subscription_status"],
        "has_playbook": has_purchased_product(user["email"], "Volume Profile Playbook")
    }
    return jsonify({"success": True, "user": user_data})


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
            
    elif event_name == "order_created":
        attrs = data.get("data", {}).get("attributes", {})
        email = attrs.get("user_email") or attrs.get("customer_email")
        
        first_item = attrs.get("first_order_item") or {}
        # Safely extract product or variant name to identify the playbook
        product_name = (
            first_item.get("product_name") or 
            attrs.get("variant_name") or 
            ""
        ).lower()
        
        if email and "playbook" in product_name:
            register_purchase(email, "Volume Profile Playbook")
            print(f"[Webhook] User {email} purchased Volume Profile Playbook")
            
    return jsonify({"success": True})


# Admin/Developer Testing Upgrades
@app.route("/api/admin/upgrade")
def admin_upgrade():
    email = request.args.get("email")
    if not email or "@" not in email:
        return jsonify({"success": False, "error": "Valid email address required"}), 400
        
    # Retrieve user or register if they don't exist
    user = get_user_by_email(email)
    if not user:
        user = register_user(email)
        
    update_user_subscription(email, "active")
    updated_user = get_user_by_email(email)
    
    return jsonify({
        "success": True,
        "message": f"User {email} successfully upgraded to active Premium status.",
        "token": updated_user["token"],
        "login_link": f"https://nqbiasengine.qzz.io/?token={updated_user['token']}"
    })



if __name__ == "__main__":
    STATIC_DIR.mkdir(exist_ok=True)
    port = int(os.environ.get("PORT", 8080))
    print(f"\n  NYSE Bias Bot — Web Dashboard")
    print(f"  http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
