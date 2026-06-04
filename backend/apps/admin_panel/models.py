from mongoengine import Document, DecimalField, IntField, StringField, ReferenceField, DateTimeField
from accounts.models import User
from datetime import datetime

class GlobalSettings(Document):
    commission_rate = DecimalField(precision=4, default=0.12)  # 12%
    otp_expiry_minutes = IntField(default=10)
    sms_otp_template = StringField(default="Your SkillBridge verification code is [Code]. Valid for 10 minutes.")
    sms_booking_template = StringField(default="Hello [Name], your booking request ID [ID] has been placed successfully in escrow.")

    meta = {
        "collection": "global_settings"
    }


class AuditLog(Document):
    admin = ReferenceField(User, required=True)
    action = StringField(required=True)
    details = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "audit_logs",
        "indexes": [
            "-created_at"
        ]
    }


def log_admin_action(admin_user, action, details):
    try:
        AuditLog(admin=admin_user, action=action, details=details).save()
    except Exception:
        pass
