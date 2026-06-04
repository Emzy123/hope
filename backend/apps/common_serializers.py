from decimal import Decimal
from mongoengine import Document


def clean_value(value):
    if isinstance(value, Document):
        return str(value.id)
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, list):
        return [clean_value(item) for item in value]
    return value


def document_to_dict(document, fields):
    data = {field: clean_value(getattr(document, field, None)) for field in fields}
    data["id"] = str(document.id)
    return data
