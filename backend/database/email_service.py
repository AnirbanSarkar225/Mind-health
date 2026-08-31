"""Email service for OTP verification: Gmail SMTP on Localhost, Resend HTTPS on Render."""

from __future__ import annotations

import json
import os
import random
import smtplib
import ssl
import threading
import urllib.error
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── Render vs Localhost Environment Detection ────────────────────────────────
# Render automatically injects RENDER=true into its container environment.
IS_RENDER      = os.getenv("RENDER", "").lower() in ("true", "1")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM     = os.getenv("EMAIL_FROM", "Gita-NeuroSync <onboarding@resend.dev>")

# ── Gmail SMTP Configuration (Localhost) ──────────────────────────────────────
SMTP_EMAIL    = os.getenv("SMTP_EMAIL", "gitaneurosynchelpdesk@gmail.com")
_RAW_PASS     = os.getenv("SMTP_APP_PASS", os.getenv("SMTP_PASSWORD", "ujsq jfix ahgs vvtl"))
SMTP_APP_PASS = _RAW_PASS.replace(" ", "")


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP string."""
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def _build_email_html(username: str, otp: str) -> str:
    """Build responsive HTML template for verification email."""
    return (
        '<div style="font-family:Arial,sans-serif;max-width:500px;padding:24px;'
        'background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;">'
        '<h2 style="color:#0F172A;margin-top:0;">Gita-NeuroSync</h2>'
        f'<p style="color:#334155;font-size:15px;">Hello <strong>{username}</strong>,</p>'
        '<p style="color:#334155;font-size:15px;">Your 6-digit email verification code is:</p>'
        '<div style="text-align:center;margin:24px 0;">'
        f'<span style="display:inline-block;background:#2A9D8F;color:#FFFFFF;'
        f'font-size:28px;font-weight:800;letter-spacing:8px;padding:12px 28px;'
        f'border-radius:8px;">{otp}</span>'
        '</div>'
        '<p style="color:#64748B;font-size:13px;">This code expires in 10 minutes. '
        'If you did not request this, please ignore.</p>'
        '</div>'
    )


def _send_via_resend_https(recipient_email: str, otp: str, username: str) -> bool:
    """Send OTP via Resend HTTPS REST API (Port 443 on Render)."""
    api_key = os.getenv("RESEND_API_KEY", RESEND_API_KEY).strip()
    if not api_key:
        print("[EMAIL SERVICE] RESEND_API_KEY not configured on Render.")
        return False
    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Gita-NeuroSync/1.0",
        }
        data = {
            "from": EMAIL_FROM,
            "to": [recipient_email],
            "subject": "Gita-NeuroSync - Email Verification Code",
            "html": _build_email_html(username, otp),
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status in (200, 201):
                print(f"[EMAIL SERVICE - RENDER] Successfully sent OTP to {recipient_email} via Resend HTTPS (Port 443)")
                return True
    except Exception as e:
        print(f"[EMAIL SERVICE - RENDER] Resend delivery error ({type(e).__name__}: {e})")
    return False


def _send_via_smtp(recipient_email: str, otp: str, username: str) -> bool:
    """Send OTP via Gmail SMTP on Localhost (Ports 465 / 587)."""
    subject = "Gita-NeuroSync - Email Verification Code"
    html_body = _build_email_html(username, otp)
    plain_body = (
        f"Hello {username},\n\n"
        f"Your Gita-NeuroSync verification code is: {otp}\n\n"
        f"This code expires in 10 minutes.\n"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Gita-NeuroSync <{SMTP_EMAIL}>"
    msg["To"] = recipient_email
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    context = ssl.create_default_context()

    # Port 465 (SSL)
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=8) as server:
            server.login(SMTP_EMAIL, SMTP_APP_PASS)
            server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())
        print(f"[EMAIL SERVICE - LOCAL] Successfully sent OTP to {recipient_email} via Gmail SSL (Port 465)")
        return True
    except Exception as e1:
        print(f"[EMAIL SERVICE - LOCAL] Port 465 failed ({type(e1).__name__}: {e1}), trying Port 587...")

    # Port 587 (STARTTLS)
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=8) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_APP_PASS)
            server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())
        print(f"[EMAIL SERVICE - LOCAL] Successfully sent OTP to {recipient_email} via Gmail STARTTLS (Port 587)")
        return True
    except Exception as e2:
        print(f"[EMAIL SERVICE - LOCAL ERROR] SMTP failed ({type(e2).__name__}: {e2})")
        return False


def send_otp_email(recipient_email: str, otp: str, username: str) -> bool:
    """
    Dispatcher:
    - On Render (detected via RENDER=true or RESEND_API_KEY present): Uses Resend HTTPS (Port 443).
    - On Localhost: Uses Gmail SMTP directly (Ports 465 / 587).
    """
    if IS_RENDER or (RESEND_API_KEY and os.getenv("RENDER_SERVICE_ID")):
        return _send_via_resend_https(recipient_email, otp, username)
    
    # Localhost environment
    return _send_via_smtp(recipient_email, otp, username)


def send_otp_email_async(recipient_email: str, otp: str, username: str) -> None:
    """Non-blocking background email dispatch."""
    t = threading.Thread(
        target=send_otp_email,
        args=(recipient_email, otp, username),
        daemon=True,
    )
    t.start()
