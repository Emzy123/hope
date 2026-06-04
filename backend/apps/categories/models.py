from datetime import datetime
from mongoengine import BooleanField, DateTimeField, Document, ReferenceField, StringField


class Category(Document):
    name = StringField(required=True, max_length=100)
    slug = StringField(required=True, unique=True, max_length=120)
    description = StringField()
    icon = StringField(max_length=80)
    parent = ReferenceField("self", null=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "categories",
        "indexes": ["slug", "parent", "is_active"],
    }
