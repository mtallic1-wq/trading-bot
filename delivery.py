"""
Formatters and HTTP delivery service clients for Brevo (Email) and Twilio (WhatsApp).
"""
import os
import requests
from typing import Dict, Optional


def format_report_whatsapp(report: Dict) -> str:
    """Format report into plain text with emojis optimized for WhatsApp."""
    date_str = report.get("date", "")
    side = report.get("side", "NEUTRAL").upper()
    bias_nq = report.get("bias_nq", "NEUTRAL").upper()
    
    # Emojis for direction
    dir_emoji = "▲" if "BULL" in side or "BUY" in side else "▼" if "BEAR" in side or "SELL" in side else "⚖️"
    bias_col = "🟢" if "BULL" in bias_nq else "🔴" if "BEAR" in bias_nq else "🟡"
    
    # Key levels
    nq = report.get("nq", {})
    ph = nq.get("prev_day_high", "?")
    pl = nq.get("prev_day_low", "?")
    wh = nq.get("week_high", "?")
    wl = nq.get("week_low", "?")
    
    # Calendar events
    tv = report.get("tradingview", {})
    calendar = tv.get("economic_calendar", [])
    high_impact_events = [
        f"• {e.get('title')} (Forecast: {e.get('forecast', '-')})" 
        for e in calendar if e.get("impact") in ("3", "HIGH")
    ]
    calendar_text = "\n".join(high_impact_events) if high_impact_events else "No major high impact economic events today."
    
    # AI Summary
    analysis = report.get("analysis", {})
    analysis_text = ""
    if isinstance(analysis, dict):
        raw_analysis = analysis.get("analysis", "")
    else:
        raw_analysis = str(analysis)
        
    # Extract only the AI prediction/summary or first part of AI response
    if "## PREDICTION" in raw_analysis:
        parts = raw_analysis.split("## PREDICTION")
        # Let's clean it up slightly
        analysis_text = parts[1].split("## TOP REASONS")[0].strip()
    else:
        # Just use the first 4 lines or so
        lines = raw_analysis.split("\n")
        analysis_text = "\n".join([l for l in lines if l.strip()][:6])

    # Clean markdown table/formatting characters from analysis text for WhatsApp
    analysis_text = analysis_text.replace("**", "*").replace("|", " ").replace("---", "").strip()

    whatsapp_msg = f"""*NQ PRE-MARKET BIAS — {date_str}*
━━━━━━━━━━━━━━━━━━━━━━

📊 *DIRECTION:* {dir_emoji} {side}
📈 *NQ BIAS:* {bias_col} {bias_nq}

🔴 *PREV HIGH / LOW:* {ph} · {pl}
🟢 *WEEK HIGH / LOW:* {wh} · {wl}

📅 *ECONOMIC CATALYSTS:*
{calendar_text}

🤖 *AI ANALYSIS SUMMARY:*
{analysis_text}

━━━━━━━━━━━━━━━━━━━━━━
_Sent via NQ Bias Bot Alerts_"""
    return whatsapp_msg


def format_report_html(report: Dict) -> str:
    """Format report into styled, responsive HTML email newsletter."""
    date_str = report.get("date", "")
    side = report.get("side", "NEUTRAL").upper()
    bias_nq = report.get("bias_nq", "NEUTRAL").upper()
    
    # Theme colors
    bg_color = "#0A0A0F"
    panel_color = "#111118"
    border_color = "#1E1E2E"
    text_color = "#C8C8DC"
    white_color = "#EEEEF8"
    muted_color = "#6B6B8A"
    
    side_color = "#FFB830"  # Neutral
    if "BULL" in side or "BUY" in side:
        side_color = "#00FF94"  # Bullish green
    elif "BEAR" in side or "SELL" in side:
        side_color = "#FF4D6A"  # Bearish red

    # Key levels list
    nq = report.get("nq", {})
    ph = nq.get("prev_day_high", "?")
    pl = nq.get("prev_day_low", "?")
    wh = nq.get("week_high", "?")
    wl = nq.get("week_low", "?")
    
    # Macro Indicators rows
    macro = report.get("macro", {})
    macro_rows_html = ""
    for label, data in macro.items():
        if "error" in data:
            continue
        price = data.get("price", "?")
        dc = data.get("day_chg", 0)
        dc_col = "#FF4D6A" if dc > 0 else "#00FF94" if dc < 0 else white_color
        macro_rows_html += f"""
        <tr style="border-bottom: 1px solid {border_color};">
            <td style="padding: 10px 0; font-size: 13px; color: {text_color};">{label}</td>
            <td style="padding: 10px 0; font-size: 13px; text-align: right; color: {white_color}; font-family: monospace;">{price}</td>
            <td style="padding: 10px 0; font-size: 13px; text-align: right; color: {dc_col}; font-family: monospace;">{dc:+.3f}%</td>
        </tr>
        """
        
    # Economic calendar list
    tv = report.get("tradingview", {})
    calendar = tv.get("economic_calendar", [])
    calendar_html = ""
    if calendar:
        for e in calendar[:5]:
            if not e.get("title"):
                continue
            impact = e.get("impact", "LOW")
            imp_color = muted_color
            if impact in ("3", "HIGH"):
                imp_color = "#FF4D6A"
            elif impact in ("2", "MEDIUM"):
                imp_color = "#FFB830"
            calendar_html += f"""
            <div style="padding: 8px 0; border-bottom: 1px solid {border_color}; font-size: 12px;">
                <span style="color: {imp_color}; font-weight: bold; font-family: monospace; text-transform: uppercase;">[{impact}]</span>
                <span style="color: {text_color}; margin-left: 5px;">{e['title']}</span>
                <span style="color: {muted_color}; float: right;">Fct: {e.get('forecast','-')} | Act: {e.get('actual','-')}</span>
                <div style="clear: both;"></div>
            </div>
            """
    else:
        calendar_html = f"<div style='color: {muted_color}; font-size: 12px;'>No scheduled economic releases.</div>"

    # AI Prediction text
    analysis = report.get("analysis", {})
    raw_analysis = analysis.get("analysis", "") if isinstance(analysis, dict) else str(analysis)
    
    # Process markdown lines into simple HTML paragraphs
    paragraphs = []
    for line in raw_analysis.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("##"):
            paragraphs.append(f"<h3 style='color: {white_color}; font-size: 16px; margin-top: 18px; margin-bottom: 8px;'>{line.replace('#', '').strip()}</h3>")
        elif line.startswith("-") or line.startswith("*"):
            paragraphs.append(f"<li style='color: {text_color}; font-size: 13px; margin-left: 15px; margin-bottom: 4px;'>{line[1:].strip()}</li>")
        elif line.startswith("|"):
            # skip markdown tables for simple rendering
            continue
        else:
            paragraphs.append(f"<p style='color: {text_color}; font-size: 13px; margin-bottom: 8px; line-height: 1.6;'>{line}</p>")
            
    ai_analysis_html = "\n".join(paragraphs)

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="background-color: {bg_color}; color: {text_color}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: {panel_color}; border: 1px solid {border_color}; border-radius: 8px; padding: 25px;">
        <!-- Header -->
        <tr>
            <td style="border-bottom: 2px solid {border_color}; padding-bottom: 15px;">
                <span style="font-size: 10px; font-weight: bold; color: #00FF94; letter-spacing: 2px; text-transform: uppercase; font-family: monospace; display: block; margin-bottom: 5px;">// PRE-MARKET ANALYSIS</span>
                <span style="font-size: 24px; font-weight: 800; color: {white_color};">NQ Bias Report — {date_str}</span>
            </td>
        </tr>
        
        <!-- Bias Banner -->
        <tr>
            <td style="padding: 20px 0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="15" style="border: 1px solid {side_color}; border-radius: 6px; background-color: rgba(17, 17, 24, 0.5);">
                    <tr>
                        <td align="center">
                            <span style="font-size: 11px; font-weight: bold; color: {muted_color}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">NYSE Session Direction Prediction</span>
                            <span style="font-size: 28px; font-weight: 800; color: {side_color}; letter-spacing: 1px; display: block; margin-bottom: 5px;">{side}</span>
                            <span style="font-size: 13px; color: {white_color};">NQ Structural Trend: <strong style="color: {side_color};">{bias_nq}</strong></span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Levels & Calendar Column -->
        <tr>
            <td style="padding-bottom: 20px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <!-- Levels Column -->
                        <td width="48%" valign="top" style="border: 1px solid {border_color}; border-radius: 6px; padding: 15px; background-color: rgba(255, 255, 255, 0.01);">
                            <span style="font-size: 11px; font-weight: bold; color: {white_color}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 10px;">Key Chart Levels</span>
                            <div style="font-size: 12px; margin-bottom: 6px; color: {text_color};">
                                <span style="color: #FF4D6A; font-weight: bold;">Prev High:</span> <span style="float: right; font-family: monospace; color: {white_color};">{ph}</span>
                            </div>
                            <div style="font-size: 12px; margin-bottom: 6px; color: {text_color};">
                                <span style="color: #00FF94; font-weight: bold;">Prev Low:</span> <span style="float: right; font-family: monospace; color: {white_color};">{pl}</span>
                            </div>
                            <div style="font-size: 12px; margin-bottom: 6px; color: {text_color};">
                                <span style="color: #4D9EFF;">Week High:</span> <span style="float: right; font-family: monospace; color: {white_color};">{wh}</span>
                            </div>
                            <div style="font-size: 12px; color: {text_color};">
                                <span style="color: #4D9EFF;">Week Low:</span> <span style="float: right; font-family: monospace; color: {white_color};">{wl}</span>
                            </div>
                        </td>
                        <td width="4%"></td>
                        <!-- Calendar Column -->
                        <td width="48%" valign="top" style="border: 1px solid {border_color}; border-radius: 6px; padding: 15px; background-color: rgba(255, 255, 255, 0.01);">
                            <span style="font-size: 11px; font-weight: bold; color: {white_color}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 10px;">Economic Events</span>
                            {calendar_html}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Macro Indicators -->
        <tr>
            <td style="padding-bottom: 20px;">
                <span style="font-size: 12px; font-weight: bold; color: {white_color}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 10px;">Macroeconomic Backdrop</span>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    {macro_rows_html}
                </table>
            </td>
        </tr>
        
        <!-- AI Summary -->
        <tr>
            <td style="border-top: 1px solid {border_color}; padding-top: 20px;">
                <span style="font-size: 12px; font-weight: bold; color: {white_color}; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 12px;">🤖 AI Market Intelligence</span>
                <div style="background-color: rgba(255, 255, 255, 0.015); border: 1px solid {border_color}; border-radius: 6px; padding: 15px;">
                    {ai_analysis_html}
                </div>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="border-top: 1px solid {border_color}; margin-top: 25px; padding-top: 20px; font-size: 10px; color: {muted_color}; text-align: center;">
                <p>You are receiving this pre-market trading signal because you are a registered subscriber.</p>
                <p style="margin-top: 10px;">
                    <a href="https://nqbiasbot.com/settings" style="color: #4D9EFF; text-decoration: none;">Manage Notification Settings</a> | 
                    <a href="https://nqbiasbot.com" style="color: #4D9EFF; text-decoration: none;">View Live Dashboard</a>
                </p>
                <p style="margin-top: 15px;">© 2026 NQ Bias Bot. Trading involves substantial risk of loss.</p>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html


def send_email_via_brevo(to_email: str, subject: str, html_content: str) -> bool:
    """Send an HTML email transactional template via Brevo REST API v3."""
    api_key = os.environ.get("BREVO_API_KEY", "")
    from_email = os.environ.get("BREVO_FROM_EMAIL", "reports@nqbiasbot.com")
    from_name = os.environ.get("BREVO_FROM_NAME", "NQ Bias Bot")
    
    if not api_key:
        print(f"[Brevo Mock] Email to {to_email} skipped - no API key in .env")
        return False
        
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": api_key,
        "content-type": "application/json",
        "accept": "application/json"
    }
    payload = {
        "sender": {"name": from_name, "email": from_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        if resp.status_code in (200, 201, 202):
            print(f"[Brevo] Email successfully delivered to {to_email}")
            return True
        else:
            print(f"[Brevo Error] Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"[Brevo Exception] Failed to send email to {to_email}: {e}")
        return False


def send_whatsapp_via_twilio(to_number: str, text_content: str) -> bool:
    """Send a plain-text WhatsApp alert via Twilio REST API."""
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_number = os.environ.get("TWILIO_WHATSAPP_FROM", "")  # e.g. "+14155238886"
    
    if not account_sid or not auth_token or not from_number:
        print(f"[Twilio Mock] WhatsApp to {to_number} skipped - missing credentials in .env")
        return False
        
    # Ensure phone numbers are correctly prefixed for twilio whatsapp channel
    to_whatsapp = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number
    from_whatsapp = f"whatsapp:{from_number}" if not from_number.startswith("whatsapp:") else from_number
    
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    auth = (account_sid, auth_token)
    payload = {
        "From": from_whatsapp,
        "To": to_whatsapp,
        "Body": text_content
    }
    
    try:
        resp = requests.post(url, data=payload, auth=auth, timeout=15)
        if resp.status_code in (200, 201):
            print(f"[Twilio] WhatsApp alert successfully dispatched to {to_number}")
            return True
        else:
            print(f"[Twilio Error] Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"[Twilio Exception] Failed to send WhatsApp message to {to_number}: {e}")
        return False
