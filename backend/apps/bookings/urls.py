from django.urls import path
from bookings.views import booking_list_create, booking_transition

urlpatterns = [
    path("", booking_list_create, name="booking_list_create"),
    path("<str:booking_id>/<str:status>/", booking_transition, name="booking_transition"),
]
