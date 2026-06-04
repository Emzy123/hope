from django.urls import path
from notifications.views import list_notifications, mark_read, mark_all_read

urlpatterns = [
    path("", list_notifications, name="list_notifications"),
    path("<str:notification_id>/read/", mark_read, name="mark_read"),
    path("mark-all-read/", mark_all_read, name="mark_all_read"),
]
