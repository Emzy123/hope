from datetime import datetime
from mongoengine import DateTimeField, DecimalField, Document, ReferenceField, StringField
from accounts.models import User
from workers.models import WorkerProfile


class Booking(Document):
    STATUS_CHOICES = ("pending", "accepted", "rejected", "in_progress", "completed_by_worker", "done", "cancelled", "disputed", "expired")
    PAYMENT_STATUS_CHOICES = ("unpaid", "pending", "escrowed", "released", "refunded")

    customer = ReferenceField(User, required=True)
    worker = ReferenceField(WorkerProfile, required=True)
    status = StringField(required=True, choices=STATUS_CHOICES, default="pending")
    payment_status = StringField(required=True, choices=PAYMENT_STATUS_CHOICES, default="unpaid")
    job_description = StringField(required=True)
    address = StringField(required=True)
    scheduled_for = DateTimeField(required=True)
    quoted_amount = DecimalField(precision=2, required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "bookings",
        "indexes": [
            "customer",
            {"fields": ["worker", "status"]},
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
