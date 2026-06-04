"""
email_utils.py — Brevo (Sendinblue) transactional email dispatcher for OTP.

Uses Brevo's free SMTP or API to deliver OTP codes via email.
Completely free up to 300 emails/day.
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_otp_email(to_email: str, code: str, full_name: str = "there") -> bool:
    """
    Send an OTP code to the given email address via Brevo.
    Returns True on success, False on failure.
    """
    api_key = getattr(settings, "BREVO_API_KEY", "")
    sender_email = getattr(settings, "BREVO_SENDER_EMAIL", "noreply@skillbridge.ng")
    sender_name = getattr(settings, "BREVO_SENDER_NAME", "SkillBridge")

    if not api_key:
        logger.warning("BREVO_API_KEY is not configured — email OTP not sent.")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0f3d26,#1a5c38);padding:32px 40px;text-align:center;">
                <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">SkillBridge</p>
                <p style="margin:4px 0 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#86efac;">Nigeria First</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1e293b;">Hi {full_name},</p>
                <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                  Here is your one-time verification code for SkillBridge. It expires in <strong>10 minutes</strong>.
                </p>
                <!-- OTP Box -->
                <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Your verification code</p>
                  <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:12px;color:#0f3d26;font-family:monospace;">{code}</p>
                </div>
                <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                  If you did not request this code, you can safely ignore this email. Do not share this code with anyone — SkillBridge will never ask for it.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#94a3b8;">© 2026 SkillBridge Nigeria Ltd. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": f"{code} is your SkillBridge verification code",
        "htmlContent": html_body,
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers={
                "accept": "application/json",
                "api-key": api_key,
                "content-type": "application/json",
            },
            timeout=10,
        )
        if response.status_code in (200, 201):
            logger.info("OTP email sent to %s via Brevo.", to_email)
            return True

        logger.error(
            "Brevo rejected OTP email to %s: %s — %s",
            to_email, response.status_code, response.text[:200],
        )
        return False
    except requests.RequestException as exc:
        logger.error("Brevo email request failed: %s", exc)
        return False
