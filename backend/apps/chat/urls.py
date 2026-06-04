from django.urls import path
from chat.views import messages_list_create

urlpatterns = [
    path("<str:booking_id>/messages/", messages_list_create, name="messages_list_create"),
]
