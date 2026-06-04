from datetime import datetime
from mongoengine import DateTimeField, Document, ReferenceField, StringField
from accounts.models import User
from bookings.models import Booking


class Message(Document):
    booking = ReferenceField(Booking, required=True)
    sender = ReferenceField(User, required=True)
    body = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "messages",
        "indexes": ["booking", "sender", "created_at"],
    }
