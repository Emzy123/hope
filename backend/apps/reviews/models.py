from datetime import datetime
from mongoengine import DateTimeField, Document, IntField, ReferenceField, StringField
from accounts.models import User
from bookings.models import Booking
from workers.models import WorkerProfile


class Review(Document):
    booking = ReferenceField(Booking, required=True, unique=True)
    customer = ReferenceField(User, required=True)
    worker = ReferenceField(WorkerProfile, required=True)
    rating = IntField(required=True, min_value=1, max_value=5)
    comment = StringField()
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "reviews",
        "indexes": ["worker", "customer"],
    }
