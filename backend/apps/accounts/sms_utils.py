"""
sms_utils.py — Live Termii SMS dispatcher.

Usage:
    from accounts.sms_utils import send_sms, send_otp_sms, send_notification_sms

All functions are fire-and-forget; they return True on success and False on
any error so that callers never crash due to an SMS failure.
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TERMII_BASE_URL = "https://api.ng.termii.com/api"


def _get_api_key() -> str:
    return getattr(settings, "TERMII_API_KEY", "")


def send_sms(to: str, message: str, channel: str = "generic") -> bool:
    """
    Low-level Termii send function.

    Args:
        to:      Recipient phone in international format (e.g. +2348012345678)
        message: The SMS body text
        channel: Termii channel — 'generic', 'dnd', or 'whatsapp'

    Returns:
        True if the message was accepted by Termii, False otherwise.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning("TERMII_API_KEY is not configured — SMS not sent.")
        return False

    # Normalise phone: Termii expects numbers without leading zeros
    phone = to.strip().replace(" ", "")
    if phone.startswith("0"):
        phone = "+234" + phone[1:]
    if not phone.startswith("+"):
        phone = "+" + phone

    payload = {
        "to": phone,
        "from": getattr(settings, "TERMII_SENDER_ID", "SkillBridge"),
        "sms": message,
        "type": "plain",
        "channel": channel,
        "api_key": api_key,
    }

    try:
        response = requests.post(
            f"{TERMII_BASE_URL}/sms/send",
            json=payload,
            timeout=10,
        )
        data = response.json()
        # Termii returns a 200 with a `message` field on success
        if response.ok and data.get("message") in ("Successfully Sent", "Message Sent"):
            logger.info("SMS sent to %s via Termii (channel=%s)", phone, channel)
            return True

        logger.warning(
            "Termii rejected SMS to %s: %s",
            phone,
            data.get("message", response.text),
        )
        return False

    except requests.RequestException as exc:
        logger.error("Termii SMS request failed: %s", exc)
        return False


def send_otp_sms(phone: str, code: str) -> bool:
    """
    Send an OTP verification code via SMS.
    """
    message = (
        f"Your SkillBridge verification code is: {code}\n"
        f"It expires in 10 minutes. Do not share it with anyone."
    )
    return send_sms(phone, message)


def send_notification_sms(phone: str, title: str, body: str) -> bool:
    """
    Send a platform notification via SMS (used for escrow events, booking alerts, etc).
    """
    message = f"[SkillBridge] {title}: {body}"
    return send_sms(phone, message)
