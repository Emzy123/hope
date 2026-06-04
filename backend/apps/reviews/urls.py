from django.urls import path
from reviews.views import review_create, worker_reviews

urlpatterns = [
    path("", review_create, name="review_create"),
    path("worker/<str:worker_id>/", worker_reviews, name="worker_reviews"),
]
