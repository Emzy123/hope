from datetime import datetime, timedelta
from mongoengine import BooleanField, DateTimeField, Document, EmailField, IntField, StringField
from werkzeug.security import generate_password_hash, check_password_hash

class User(Document):
    ROLE_CHOICES = ("customer", "worker", "admin")

    email = EmailField(required=True, unique=True)
    phone = StringField(max_length=20)
    full_name = StringField(max_length=120)
    role = StringField(required=True, choices=ROLE_CHOICES, default="customer")
    password_hash = StringField()  # only set for admin accounts
    is_active = BooleanField(default=True)
    is_verified = BooleanField(default=False)
    # Onboarding state — True once user completes or skips the onboarding wizard
    is_onboarded = BooleanField(default=False)
    onboarding_skipped_at = DateTimeField()  # set if user chose to skip
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, raw_password)

    meta = {
        "collection": "users",
        "indexes": [
            "email",
            {"fields": ["phone"], "sparse": True},
            "role",
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


class OTPCode(Document):
    """
    Stores pending OTP codes keyed by email.
    MongoDB TTL index auto-deletes expired documents.
    """
    email = EmailField()
    phone = StringField(max_length=20)
    code = StringField(required=True, max_length=6)
    attempts = IntField(default=0)
    expires_at = DateTimeField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "otp_codes",
        "indexes": [
            "email",
            "phone",
            {"fields": ["expires_at"], "expireAfterSeconds": 0},
        ],
    }

    @classmethod
    def create_code(cls, email=None, code=None, phone=None):
        if email:
            cls.objects(email=email).delete()
        if phone:
            cls.objects(phone=phone).delete()
        return cls(
            email=email,
            phone=phone or "",
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        ).save()
