from django.urls import path
from payments.views import initiate_payment, simulate_success, paystack_webhook

urlpatterns = [
    path("initiate/", initiate_payment, name="initiate_payment"),
    path("simulate-success/", simulate_success, name="simulate_success"),
    path("webhook/", paystack_webhook, name="paystack_webhook"),
]
