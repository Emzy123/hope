from datetime import datetime
from mongoengine import BooleanField, DateTimeField, DecimalField, Document, ReferenceField, StringField
from bookings.models import Booking


class Payment(Document):
    STATUS_CHOICES = ("initialized", "success", "failed", "abandoned")

    booking = ReferenceField(Booking, required=True)
    paystack_reference = StringField(required=True, unique=True)
    authorization_url = StringField()
    amount = DecimalField(precision=2, required=True)
    status = StringField(required=True, choices=STATUS_CHOICES, default="initialized")
    escrow_released = BooleanField(default=False)
    worker_amount = DecimalField(precision=2)
    platform_commission = DecimalField(precision=2)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "payments",
        "indexes": ["paystack_reference", "booking"],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
