from django.contrib import admin
from django.urls import path, include
from config.views import health_check

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health_check'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/categories/', include('categories.urls')),
    path('api/v1/workers/', include('workers.urls')),
    path('api/v1/bookings/', include('bookings.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/chat/', include('chat.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/admin/', include('admin_panel.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

