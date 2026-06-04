from django.urls import path
from workers.views import (
    worker_list, my_worker_profile, create_worker_profile,
    toggle_availability, admin_approve_worker, admin_reject_worker,
    upload_avatar
)

urlpatterns = [
    path("", worker_list, name="worker_list"),
    path("profile/", create_worker_profile, name="create_worker_profile"),
    path("my-profile/", my_worker_profile, name="my_worker_profile"),
    path("my-profile/avatar/", upload_avatar, name="upload_avatar"),
    path("availability/", toggle_availability, name="toggle_availability"),
    path("<str:worker_id>/approve/", admin_approve_worker, name="admin_approve_worker"),
    path("<str:worker_id>/reject/", admin_reject_worker, name="admin_reject_worker"),
]
