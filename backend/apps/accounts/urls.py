from django.urls import path
from accounts.views import (
    logout, request_otp, verify_otp, auth_me, admin_login,
    admin_users_list_create, admin_users_toggle_active,
    admin_reset_password_request, admin_reset_password_confirm
)

urlpatterns = [
    path("request-otp/", request_otp, name="request_otp"),
    path("verify-otp/", verify_otp, name="verify_otp"),
    path("admin-login/", admin_login, name="admin_login"),
    path("admin-reset-password/request/", admin_reset_password_request, name="admin_reset_password_request"),
    path("admin-reset-password/confirm/", admin_reset_password_confirm, name="admin_reset_password_confirm"),
    path("logout/", logout, name="logout"),
    path("me/", auth_me, name="auth_me"),                         # GET + PATCH
    path("admin/users/", admin_users_list_create, name="admin_users_list_create"),
    path("admin/users/<str:user_id>/toggle-active/", admin_users_toggle_active, name="admin_users_toggle_active"),
]
