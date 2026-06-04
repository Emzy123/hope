from datetime import datetime
from mongoengine import BooleanField, DateTimeField, DecimalField, Document, FloatField, IntField, ListField, ReferenceField, StringField
from accounts.models import User
from categories.models import Category


class WorkerProfile(Document):
    user = ReferenceField(User, required=True, unique=True)
    categories = ListField(ReferenceField(Category))
    bio = StringField()
    city = StringField(required=True, max_length=80)
    state = StringField(default="Lagos", max_length=80)
    hourly_rate = DecimalField(precision=2, default=0)
    rating_avg = FloatField(default=0)
    rating_count = IntField(default=0)
    portfolio_urls = ListField(StringField())
    avatar_url = StringField()
    is_available = BooleanField(default=True)
    is_approved = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "worker_profiles",
        "indexes": [
            "user",
            "categories",
            {"fields": ["city", "is_available", "is_approved"]},
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
