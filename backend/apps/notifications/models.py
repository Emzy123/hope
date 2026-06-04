from datetime import datetime
from mongoengine import BooleanField, DateTimeField, Document, ReferenceField, StringField
from accounts.models import User


class Notification(Document):
    user = ReferenceField(User, required=True)
    title = StringField(required=True, max_length=120)
    body = StringField(required=True)
    is_read = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "notifications",
        "indexes": ["user", "is_read", "created_at"],
    }
