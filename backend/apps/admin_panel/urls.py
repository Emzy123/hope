from django.urls import path
from admin_panel.views import admin_dashboard_stats, admin_settings, audit_log_list

urlpatterns = [
    path("dashboard-stats/", admin_dashboard_stats, name="admin_dashboard_stats"),
    path("settings/", admin_settings, name="admin_settings"),
    path("audit-logs/", audit_log_list, name="audit_log_list"),
]
