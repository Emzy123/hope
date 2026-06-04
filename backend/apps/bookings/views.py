import json
from datetime import datetime
from decimal import Decimal, InvalidOperation
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from auth_utils import require_auth
from bookings.models import Booking
from common_serializers import document_to_dict
from workers.models import WorkerProfile
from admin_panel.models import log_admin_action

TRANSITIONS = {
    "pending": {"accepted", "rejected", "cancelled"},
    "accepted": {"in_progress", "cancelled"},
    "in_progress": {"completed_by_worker", "disputed"},
    "completed_by_worker": {"done", "disputed"},
    "disputed": {"done", "cancelled"},
}


def booking_payload(booking):
    data = document_to_dict(
        booking,
        [
            "customer",
            "worker",
            "status",
            "payment_status",
            "job_description",
            "address",
            "scheduled_for",
            "quoted_amount",
            "created_at",
            "updated_at",
        ],
    )
    data["worker_name"] = booking.worker.user.full_name if booking.worker and booking.worker.user else ""
    data["customer_name"] = booking.customer.full_name if booking.customer else ""

    # Attach real ledger split from the linked Payment document
    try:
        from payments.models import Payment
        payment = Payment.objects(booking=booking).first()
        if payment:
            data["paystack_reference"] = payment.paystack_reference
            data["payment_amount"] = float(payment.amount) if payment.amount else None
            data["worker_amount"] = float(payment.worker_amount) if payment.worker_amount else None
            data["platform_commission"] = float(payment.platform_commission) if payment.platform_commission else None
            data["escrow_released"] = payment.escrow_released
        else:
            data["paystack_reference"] = None
            data["payment_amount"] = None
            data["worker_amount"] = None
            data["platform_commission"] = None
            data["escrow_released"] = False
    except Exception:
        data["worker_amount"] = None
        data["platform_commission"] = None
        data["escrow_released"] = False

    return data


def request_data(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST


@csrf_exempt
@require_auth("customer", "worker", "admin")
def booking_list_create(request):
    user = request.skillbridge_user

    if request.method == "GET":
        try:
            from datetime import timedelta
            expiry_limit = datetime.utcnow() - timedelta(hours=24)
            Booking.objects(status="pending", created_at__lt=expiry_limit).update(status="expired")
        except Exception:
            pass

        if user.role == "customer":
            bookings = Booking.objects(customer=user).order_by("-created_at")
        elif user.role == "worker":
            profile = WorkerProfile.objects(user=user).first()
            if not profile:
                return JsonResponse({"results": []})
            bookings = Booking.objects(worker=profile).order_by("-created_at")
        else:  # admin
            bookings = Booking.objects.order_by("-created_at")
        return JsonResponse({"results": [booking_payload(booking) for booking in bookings]})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    if user.role != "customer":
        return JsonResponse({"detail": "Permission denied."}, status=403)

    data = request_data(request)
    worker = WorkerProfile.objects(id=data.get("worker_id"), is_approved=True).first()
    if worker is None:
        return JsonResponse({"detail": "Approved worker not found."}, status=404)

    active_jobs = Booking.objects(worker=worker, status__in=["accepted", "in_progress", "completed_by_worker", "disputed"]).count()
    if active_jobs >= 3:
        return JsonResponse({"detail": "This worker has reached their maximum limit of 3 concurrent active jobs."}, status=400)

    try:
        scheduled_for = datetime.fromisoformat(str(data.get("scheduled_for")).replace("Z", "+00:00"))
        quoted_amount = Decimal(str(data.get("quoted_amount")))
    except (TypeError, ValueError, InvalidOperation):
        return JsonResponse({"detail": "Invalid scheduled_for or quoted_amount."}, status=400)

    job_description = str(data.get("job_description") or "").strip()
    address = str(data.get("address") or "").strip()
    if not job_description or not address:
        return JsonResponse({"detail": "job_description and address are required."}, status=400)

    booking = Booking(
        customer=user,
        worker=worker,
        job_description=job_description,
        address=address,
        scheduled_for=scheduled_for,
        quoted_amount=quoted_amount,
    ).save()
    return JsonResponse({"booking": booking_payload(booking)}, status=201)


@csrf_exempt
@require_auth("customer", "worker", "admin")
def booking_transition(request, booking_id, status):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    booking = Booking.objects(id=booking_id).first()
    if booking is None:
        return JsonResponse({"detail": "Booking not found."}, status=404)

    user = request.skillbridge_user
    
    # If currently disputed, only admin can transition it
    if booking.status == "disputed" and user.role != "admin":
        return JsonResponse({"detail": "Permission denied. Only administrators can resolve disputed bookings."}, status=403)

    # Verify user's relationship to this booking
    if user.role == "worker":
        if str(booking.worker.user.id) != str(user.id):
            return JsonResponse({"detail": "Permission denied."}, status=403)
        # Workers cannot unilaterally transition to done (which releases escrow)
        if status == "done":
            return JsonResponse({"detail": "Permission denied. Only customers or admins can release escrowed funds."}, status=403)
            
    elif user.role == "customer":
        if str(booking.customer.id) != str(user.id):
            return JsonResponse({"detail": "Permission denied."}, status=403)
        # Customers cannot transition to completed_by_worker, accepted, or rejected
        if status in ("completed_by_worker", "accepted", "rejected"):
            return JsonResponse({"detail": "Permission denied. Only workers can accept, reject, or mark work complete."}, status=403)

    allowed_statuses = TRANSITIONS.get(booking.status, set())
    if status not in allowed_statuses:
        return JsonResponse({"detail": f"Cannot transition from {booking.status} to {status}."}, status=400)

    if status == "accepted":
        active_jobs = Booking.objects(worker=booking.worker, status__in=["accepted", "in_progress", "completed_by_worker", "disputed"]).count()
        if active_jobs >= 3:
            return JsonResponse({"detail": "You cannot accept more than 3 active jobs concurrently."}, status=400)

    booking.status = status
    if status == "done":
        booking.payment_status = "released"
        try:
            from payments.models import Payment
            payment = Payment.objects(booking=booking, status="success").first()
            if payment:
                payment.escrow_released = True
                
                # Fetch settings to get commission rate
                from admin_panel.models import GlobalSettings
                settings_obj = GlobalSettings.objects.first()
                commission_rate = settings_obj.commission_rate if settings_obj else Decimal("0.12")
                
                # Calculate platform commission and worker earnings
                payment.platform_commission = payment.amount * commission_rate
                payment.worker_amount = payment.amount - payment.platform_commission
                payment.save()

                # SMS — notify worker that funds are released
                try:
                    from accounts.sms_utils import send_notification_sms
                    net = float(payment.worker_amount or 0)
                    send_notification_sms(
                        booking.worker.user.phone,
                        "Funds Released",
                        f"Great news! ₦{net:,.0f} has been released from escrow for your completed job. Payment is being processed."
                    )
                    # Also notify customer
                    send_notification_sms(
                        booking.customer.phone,
                        "Job Complete",
                        f"You have released payment for your SkillBridge job. Thank you for using SkillBridge!"
                    )
                except Exception:
                    pass
        except Exception:
            pass
    elif status == "cancelled":
        if booking.payment_status == "escrowed":
            booking.payment_status = "refunded"
            
    booking.save()

    if user.role == "admin":
        log_admin_action(
            user,
            "Dispute Arbitration",
            f"Arbitrated disputed booking #{booking_id} status to '{status}'"
        )

    return JsonResponse({"booking": booking_payload(booking)})
