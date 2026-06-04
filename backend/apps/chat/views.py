import json
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from auth_utils import require_auth
from bookings.models import Booking
from chat.models import Message

def request_data(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST

@csrf_exempt
@require_auth("customer", "worker", "admin")
def list_messages(request, booking_id):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    booking = Booking.objects(id=booking_id).first()
    if not booking:
        return JsonResponse({"detail": "Booking not found."}, status=404)

    # Participant verification (admin allowed)
    if user.role != "admin":
        is_customer = str(booking.customer.id) == str(user.id)
        is_worker = str(booking.worker.user.id) == str(user.id)
        if not is_customer and not is_worker:
            return JsonResponse({"detail": "Permission denied. You are not a participant in this booking."}, status=403)

    messages = Message.objects(booking=booking).order_by("created_at")
    results = []
    for msg in messages:
        # Determine sender type for frontend simplicity
        sender_type = "user" if str(msg.sender.id) == str(booking.customer.id) else "worker"
        results.append({
            "id": str(msg.id),
            "sender": sender_type,
            "sender_name": msg.sender.full_name,
            "text": msg.body,
            "time": msg.created_at.strftime("%I:%M %p") if msg.created_at else ""
        })

    return JsonResponse({"results": results})


@csrf_exempt
@require_auth("customer", "worker")
def create_message(request, booking_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    booking = Booking.objects(id=booking_id).first()
    if not booking:
        return JsonResponse({"detail": "Booking not found."}, status=404)

    is_customer = str(booking.customer.id) == str(user.id)
    is_worker = str(booking.worker.user.id) == str(user.id)
    if not is_customer and not is_worker:
        return JsonResponse({"detail": "Permission denied."}, status=403)

    data = request_data(request)
    body = str(data.get("text") or data.get("body") or "").strip()
    if not body:
        return JsonResponse({"detail": "Message text is required."}, status=400)

    msg = Message(
        booking=booking,
        sender=user,
        body=body
    ).save()

    sender_type = "user" if is_customer else "worker"
    return JsonResponse({
        "message": {
            "id": str(msg.id),
            "sender": sender_type,
            "sender_name": user.full_name,
            "text": msg.body,
            "time": msg.created_at.strftime("%I:%M %p")
        }
    }, status=201)


@csrf_exempt
@require_auth("customer", "worker", "admin")
def messages_list_create(request, booking_id):
    if request.method == "GET":
        return list_messages(request, booking_id)
    elif request.method == "POST":
        if request.skillbridge_user.role == "admin":
            return JsonResponse({"detail": "Admins cannot send messages."}, status=403)
        return create_message(request, booking_id)
    return JsonResponse({"detail": "Method not allowed."}, status=405)
