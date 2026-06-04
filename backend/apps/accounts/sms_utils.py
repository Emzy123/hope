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


def _normalise_phone(to: str) -> str:
    """Convert local format (0xxx) to international (+234xxx)."""
    phone = to.strip().replace(" ", "")
    if phone.startswith("0"):
        phone = "+234" + phone[1:]
    if not phone.startswith("+"):
        phone = "+" + phone
    return phone


def _try_send(phone: str, message: str, channel: str, sender_id: str) -> dict:
    """
    Attempt a single Termii send. Returns a dict with keys:
        ok      (bool)  – True if Termii accepted the message
        reason  (str)   – Termii message field for logging
    """
    api_key = _get_api_key()
    payload = {
        "to": phone,
        "from": sender_id,
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
        success_msgs = ("Successfully Sent", "Message Sent")
        if response.ok and data.get("message") in success_msgs:
            return {"ok": True, "reason": data.get("message", "ok")}
        return {"ok": False, "reason": data.get("message", response.text[:200])}
    except requests.RequestException as exc:
        return {"ok": False, "reason": str(exc)}


def send_sms(to: str, message: str, channel: str = "generic") -> bool:
    """
    Send an SMS via Termii.

    Automatically retries with the 'dnd' channel if the initial channel
    fails — required for Nigerian numbers registered on the DND list.

    Returns True if the message was accepted by Termii, False otherwise.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning("TERMII_API_KEY is not configured — SMS not sent.")
        return False

    phone = _normalise_phone(to)
    sender_id = getattr(settings, "TERMII_SENDER_ID", "N-Alert")

    # Try the requested channel first
    result = _try_send(phone, message, channel, sender_id)
    if result["ok"]:
        logger.info("SMS sent to %s via channel=%s", phone, channel)
        return True

    logger.warning(
        "Termii channel=%s rejected SMS to %s: %s — retrying with 'dnd'",
        channel, phone, result["reason"],
    )

    # Fallback: DND channel bypasses Nigeria DND registry
    if channel != "dnd":
        # DND channel requires numeric sender IDs in Nigeria; use a safe default
        dnd_sender = sender_id if sender_id.isdigit() else "N-Alert"
        result = _try_send(phone, message, "dnd", dnd_sender)
        if result["ok"]:
            logger.info("SMS sent to %s via channel=dnd (fallback)", phone)
            return True
        logger.error("Termii dnd fallback also failed to %s: %s", phone, result["reason"])

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
