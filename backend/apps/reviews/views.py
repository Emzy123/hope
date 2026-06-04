import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from auth_utils import require_auth
from bookings.models import Booking
from common_serializers import document_to_dict
from reviews.models import Review
from workers.models import WorkerProfile

def review_payload(review):
    data = document_to_dict(review, ["booking", "customer", "worker", "rating", "comment", "created_at"])
    data["customer_name"] = review.customer.full_name if review.customer else ""
    return data


def request_data(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST


@csrf_exempt
@require_auth("customer")
def review_create(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    data = request_data(request)
    booking = Booking.objects(id=data.get("booking_id"), customer=request.skillbridge_user).first()
    if booking is None:
        return JsonResponse({"detail": "Completed customer booking not found."}, status=404)
    if booking.status != "done":
        return JsonResponse({"detail": "Reviews can only be submitted for completed bookings."}, status=400)
    if Review.objects(booking=booking).first():
        return JsonResponse({"detail": "This booking has already been reviewed."}, status=400)

    try:
        rating = int(data.get("rating"))
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Rating must be an integer from 1 to 5."}, status=400)
    if rating < 1 or rating > 5:
        return JsonResponse({"detail": "Rating must be an integer from 1 to 5."}, status=400)

    review = Review(
        booking=booking,
        customer=request.skillbridge_user,
        worker=booking.worker,
        rating=rating,
        comment=str(data.get("comment") or "").strip(),
    ).save()

    worker = booking.worker
    total = (worker.rating_avg * worker.rating_count) + rating
    worker.rating_count += 1
    worker.rating_avg = round(total / worker.rating_count, 2)
    worker.save()

    return JsonResponse({"review": review_payload(review)}, status=201)


def worker_reviews(request, worker_id):
    worker = WorkerProfile.objects(id=worker_id).first()
    if worker is None:
        return JsonResponse({"detail": "Worker not found."}, status=404)
    reviews = Review.objects(worker=worker).order_by("-created_at")
    return JsonResponse({"results": [review_payload(review) for review in reviews]})
