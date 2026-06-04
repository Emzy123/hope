import json
import hmac
import hashlib
import uuid
import requests
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from auth_utils import require_auth
from bookings.models import Booking
from payments.models import Payment

@csrf_exempt
@require_auth("customer")
def initiate_payment(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    
    # Read payload
    if request.content_type == "application/json":
        try:
            data = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON."}, status=400)
    else:
        data = request.POST

    booking_id = data.get("booking_id")
    if not booking_id:
        return JsonResponse({"detail": "booking_id is required."}, status=400)

    booking = Booking.objects(id=booking_id).first()
    if not booking:
        return JsonResponse({"detail": "Booking not found."}, status=404)

    # Verify ownership
    if str(booking.customer.id) != str(user.id):
        return JsonResponse({"detail": "Permission denied."}, status=403)

    if booking.payment_status != "unpaid":
        return JsonResponse({"detail": "Payment has already been initiated or completed."}, status=400)

    paystack_key = getattr(settings, "PAYSTACK_SECRET_KEY", "sk_test_sample")
    is_mock = paystack_key == "sk_test_sample"
    
    # Generate unique transaction reference
    reference = f"sb_{uuid.uuid4().hex}"
    
    amount_in_kobo = int(booking.quoted_amount * 100)

    if is_mock:
        # Mock payment authorization url
        authorization_url = f"http://localhost:3000/payment/mock-checkout?reference={reference}&amount={booking.quoted_amount}"
        payment = Payment(
            booking=booking,
            paystack_reference=reference,
            authorization_url=authorization_url,
            amount=booking.quoted_amount,
            status="initialized"
        ).save()
        return JsonResponse({
            "authorization_url": authorization_url,
            "paystack_reference": reference,
            "is_mock": True
        })

    # For real Paystack:
    try:
        url = "https://api.paystack.co/transaction/initialize"
        headers = {
            "Authorization": f"Bearer {paystack_key}",
            "Content-Type": "application/json"
        }
        callback_url = data.get("callback_url") or f"http://localhost:3000/book/payment-success?reference={reference}"
        payload = {
            "email": user.email,
            "amount": amount_in_kobo,
            "reference": reference,
            "callback_url": callback_url
        }
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        res_data = response.json()
        if not response.ok or not res_data.get("status"):
            return JsonResponse({"detail": res_data.get("message") or "Failed to initialize payment with Paystack."}, status=400)
        
        init_data = res_data["data"]
        authorization_url = init_data["authorization_url"]
        
        payment = Payment(
            booking=booking,
            paystack_reference=reference,
            authorization_url=authorization_url,
            amount=booking.quoted_amount,
            status="initialized"
        ).save()
        
        return JsonResponse({
            "authorization_url": authorization_url,
            "paystack_reference": reference,
            "is_mock": False
        })
    except Exception as e:
        return JsonResponse({"detail": f"Error communicating with Paystack: {str(e)}"}, status=500)


@csrf_exempt
@require_auth("customer")
def simulate_success(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    if not settings.DEBUG:
        return JsonResponse({"detail": "Simulation only allowed in development mode."}, status=403)

    if request.content_type == "application/json":
        try:
            data = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON."}, status=400)
    else:
        data = request.POST

    booking_id = data.get("booking_id")
    reference = data.get("paystack_reference")
    
    payment = None
    if reference:
        payment = Payment.objects(paystack_reference=reference).first()
    elif booking_id:
        payment = Payment.objects(booking=booking_id).first()

    if not payment:
        return JsonResponse({"detail": "Payment record not found."}, status=404)

    booking = payment.booking
    if not booking:
        return JsonResponse({"detail": "Booking associated with payment not found."}, status=404)

    if str(booking.customer.id) != str(user.id):
        return JsonResponse({"detail": "Permission denied."}, status=403)

    # Immediately transition booking to accepted and payment to escrowed
    booking.status = "accepted"
    booking.payment_status = "escrowed"
    booking.save()

    payment.status = "success"
    payment.save()

    # Trigger in-app notification
    try:
        from notifications.models import Notification
        Notification(
            user=booking.worker.user,
            title="New Booking Request",
            body=f"You have a new paid booking request from {user.full_name}."
        ).save()
    except Exception:
        pass

    # Trigger live SMS to worker
    try:
        from accounts.sms_utils import send_notification_sms
        worker_phone = booking.worker.user.phone
        send_notification_sms(
            worker_phone,
            "New Paid Booking",
            f"A customer has paid and booked your service. Job: {booking.job_description[:60]}. Log in to SkillBridge to respond."
        )
    except Exception:
        pass

    return JsonResponse({
        "status": "success",
        "booking_status": booking.status,
        "payment_status": booking.payment_status
    })


@csrf_exempt
def paystack_webhook(request):
    if request.method != "POST":
        return HttpResponse("Method not allowed", status=405)

    paystack_key = getattr(settings, "PAYSTACK_SECRET_KEY", "sk_test_sample")
    signature = request.headers.get("x-paystack-signature")
    
    if not signature:
        return HttpResponse("Signature missing", status=400)

    # Verify signature using HMAC-SHA512
    payload = request.body
    computed_signature = hmac.new(
        paystack_key.encode("utf-8"),
        payload,
        hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(computed_signature, signature):
        return HttpResponse("Invalid signature", status=400)

    try:
        event_data = json.loads(payload)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON payload", status=400)

    event = event_data.get("event")
    if event == "charge.success":
        data = event_data.get("data", {})
        reference = data.get("reference")
        if not reference:
            return HttpResponse("Reference missing in event data", status=400)

        payment = Payment.objects(paystack_reference=reference).first()
        if payment:
            if payment.status == "success":
                return HttpResponse("Webhook processed successfully", status=200)
            booking = payment.booking
            if booking:
                booking.status = "accepted"
                booking.payment_status = "escrowed"
                booking.save()
                
                payment.status = "success"
                payment.save()
                
                # Send in-app notification
                try:
                    from notifications.models import Notification
                    Notification(
                        user=booking.worker.user,
                        title="New Booking Request",
                        body=f"You have a new paid booking request from {booking.customer.full_name}."
                    ).save()
                except Exception:
                    pass

                # Send live SMS to worker
                try:
                    from accounts.sms_utils import send_notification_sms
                    send_notification_sms(
                        booking.worker.user.phone,
                        "New Paid Booking",
                        f"A customer has paid and booked your service. Job: {booking.job_description[:60]}. Log in to SkillBridge to respond."
                    )
                except Exception:
                    pass

    return HttpResponse("Webhook processed successfully", status=200)
