from django.urls import path
from categories.views import category_list, admin_create_category, admin_update_category

urlpatterns = [
    path("", category_list, name="category_list"),
    path("admin-create/", admin_create_category, name="admin_create_category"),
    path("<str:category_id>/admin-update/", admin_update_category, name="admin_update_category"),
]
