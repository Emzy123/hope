import json
import hmac
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal
import pytest
from django.conf import settings
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken
from mongoengine import connect, disconnect

from accounts.models import User
from workers.models import WorkerProfile
from bookings.models import Booking
from payments.models import Payment

@pytest.fixture(scope="session", autouse=True)
def setup_mongo():
    disconnect()
    connect("test_skillbridge", host="mongodb://localhost:27017/test_skillbridge")
    yield
    disconnect()

@pytest.fixture(autouse=True)
def clear_db():
    User.objects.delete()
    WorkerProfile.objects.delete()
    Booking.objects.delete()
    Payment.objects.delete()

def get_auth_headers(user):
    refresh = RefreshToken()
    refresh["user_id"] = str(user.id)
    refresh["phone"] = user.phone
    refresh["role"] = user.role
    token = str(refresh.access_token)
    return {
        "HTTP_AUTHORIZATION": f"Bearer {token}",
        # Also set cookie for simplejwt-cookie views if any
        "HTTP_COOKIE": f"{settings.SIMPLE_JWT['AUTH_COOKIE']}={token}"
    }

@pytest.mark.django_db
def test_booking_creation_concurrency_limit():
    client = Client()

    # Create customer and worker
    customer = User(email="customer@example.com", phone="08033333333", role="customer", is_active=True).save()
    worker_user = User(email="worker@example.com", phone="08011111111", role="worker", is_active=True).save()
    worker_profile = WorkerProfile(user=worker_user, city="Lagos", hourly_rate=5000, is_approved=True).save()

    auth_headers = get_auth_headers(customer)

    # 1. Create 3 bookings successfully
    for i in range(3):
        res = client.post(
            "/api/v1/bookings/",
            data=json.dumps({
                "worker_id": str(worker_profile.id),
                "scheduled_for": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
                "quoted_amount": "5000.00",
                "job_description": f"Test job description {i}",
                "address": "123 Test Street, Lagos"
            }),
            content_type="application/json",
            **auth_headers
        )
        assert res.status_code == 201
        
        # Transition these to active statuses (accepted) so they count against cap
        booking_id = res.json()["booking"]["id"]
        booking = Booking.objects(id=booking_id).first()
        booking.status = "accepted"
        booking.save()

    # 2. Try to create a 4th booking - should be blocked by concurrency cap
    res = client.post(
        "/api/v1/bookings/",
        data=json.dumps({
            "worker_id": str(worker_profile.id),
            "scheduled_for": (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z",
            "quoted_amount": "5000.00",
            "job_description": "Failed 4th job",
            "address": "123 Test Street, Lagos"
        }),
        content_type="application/json",
        **auth_headers
    )
    assert res.status_code == 400
    assert "maximum limit of 3 concurrent active jobs" in res.json()["detail"]

@pytest.mark.django_db
def test_booking_fsm_valid_flow():
    client = Client()

    customer = User(email="customer@example.com", phone="08033333333", role="customer", is_active=True).save()
    worker_user = User(email="worker@example.com", phone="08011111111", role="worker", is_active=True).save()
    worker_profile = WorkerProfile(user=worker_user, city="Lagos", hourly_rate=5000, is_approved=True).save()

    customer_auth = get_auth_headers(customer)
    worker_auth = get_auth_headers(worker_user)

    # Create Booking (Pending)
    res = client.post(
        "/api/v1/bookings/",
        data=json.dumps({
            "worker_id": str(worker_profile.id),
            "scheduled_for": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
            "quoted_amount": "5000.00",
            "job_description": "Fix my kitchen tap",
            "address": "Lagos, Nigeria"
        }),
        content_type="application/json",
        **customer_auth
    )
    assert res.status_code == 201
    booking_id = res.json()["booking"]["id"]
    assert res.json()["booking"]["status"] == "pending"

    # Worker Accepts Booking (Accepted)
    res = client.post(f"/api/v1/bookings/{booking_id}/accepted/", **worker_auth)
    assert res.status_code == 200
    assert res.json()["booking"]["status"] == "accepted"

    # Worker Starts Work (In Progress)
    res = client.post(f"/api/v1/bookings/{booking_id}/in_progress/", **worker_auth)
    assert res.status_code == 200
    assert res.json()["booking"]["status"] == "in_progress"

    # Worker Completes Work (Completed By Worker)
    res = client.post(f"/api/v1/bookings/{booking_id}/completed_by_worker/", **worker_auth)
    assert res.status_code == 200
    assert res.json()["booking"]["status"] == "completed_by_worker"

    # Customer Confirms and Releases Escrow (Done)
    # Mocking successful payment first so done can release commission
    payment = Payment(
        booking=Booking.objects(id=booking_id).first(),
        paystack_reference="test_ref_123",
        amount=Decimal("5000.00"),
        status="success"
    ).save()

    res = client.post(f"/api/v1/bookings/{booking_id}/done/", **customer_auth)
    assert res.status_code == 200
    assert res.json()["booking"]["status"] == "done"
    assert res.json()["booking"]["payment_status"] == "released"
    assert res.json()["booking"]["escrow_released"] is True

@pytest.mark.django_db
def test_booking_fsm_invalid_transitions():
    client = Client()

    customer = User(email="customer@example.com", phone="08033333333", role="customer", is_active=True).save()
    worker_user = User(email="worker@example.com", phone="08011111111", role="worker", is_active=True).save()
    worker_profile = WorkerProfile(user=worker_user, city="Lagos", hourly_rate=5000, is_approved=True).save()

    customer_auth = get_auth_headers(customer)
    worker_auth = get_auth_headers(worker_user)

    # Create Booking (Pending)
    res = client.post(
        "/api/v1/bookings/",
        data=json.dumps({
            "worker_id": str(worker_profile.id),
            "scheduled_for": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
            "quoted_amount": "5000.00",
            "job_description": "Fix lights",
            "address": "Lagos, Nigeria"
        }),
        content_type="application/json",
        **customer_auth
    )
    booking_id = res.json()["booking"]["id"]

    # 1. Customer tries to mark Done directly from Pending (Invalid)
    res = client.post(f"/api/v1/bookings/{booking_id}/done/", **customer_auth)
    assert res.status_code == 400
    assert "Cannot transition" in res.json()["detail"]

    # 2. Worker tries to start job directly from Pending (Invalid)
    res = client.post(f"/api/v1/bookings/{booking_id}/in_progress/", **worker_auth)
    assert res.status_code == 400

    # 3. Customer tries to accept booking (Permission Denied)
    res = client.post(f"/api/v1/bookings/{booking_id}/accepted/", **customer_auth)
    assert res.status_code == 403

@pytest.mark.django_db
def test_disputed_arbitration_admin_only():
    client = Client()

    customer = User(email="customer@example.com", phone="08033333333", role="customer", is_active=True).save()
    worker_user = User(email="worker@example.com", phone="08011111111", role="worker", is_active=True).save()
    worker_profile = WorkerProfile(user=worker_user, city="Lagos", hourly_rate=5000, is_approved=True).save()
    admin_user = User(email="admin@example.com", phone="08000000000", role="admin", is_active=True).save()

    customer_auth = get_auth_headers(customer)
    admin_auth = get_auth_headers(admin_user)

    booking = Booking(
        customer=customer,
        worker=worker_profile,
        job_description="Fix AC",
        address="Lagos",
        scheduled_for=datetime.utcnow() + timedelta(days=1),
        quoted_amount=Decimal("15000.00"),
        status="in_progress"
    ).save()

    # Customer disputes booking -> transitions to disputed
    res = client.post(f"/api/v1/bookings/{str(booking.id)}/disputed/", **customer_auth)
    assert res.status_code == 200
    assert res.json()["booking"]["status"] == "disputed"

    # Customer tries to resolve and release payment -> Permission Denied (403)
    res = client.post(f"/api/v1/bookings/{str(booking.id)}/done/", **customer_auth)
    assert res.status_code == 403

    # Admin resolves dispute to done -> Allowed (200)
    res = client.post(f"/api/v1/bookings/{str(booking.id)}/done/", **admin_auth)
    assert res.status_code == 200
    assert res.json()["booking"]["status"] == "done"

@pytest.mark.django_db
def test_paystack_webhook_flow():
    client = Client()

    customer = User(email="customer@example.com", phone="08033333333", role="customer", is_active=True).save()
    worker_user = User(email="worker@example.com", phone="08011111111", role="worker", is_active=True).save()
    worker_profile = WorkerProfile(user=worker_user, city="Lagos", hourly_rate=5000, is_approved=True).save()

    booking = Booking(
        customer=customer,
        worker=worker_profile,
        job_description="Fix Fridge",
        address="Lagos",
        scheduled_for=datetime.utcnow() + timedelta(days=1),
        quoted_amount=Decimal("8000.00"),
        status="pending",
        payment_status="unpaid"
    ).save()

    payment = Payment(
        booking=booking,
        paystack_reference="ref_xyz123",
        amount=Decimal("8000.00"),
        status="initialized"
    ).save()

    paystack_key = getattr(settings, "PAYSTACK_SECRET_KEY", "sk_test_sample")
    
    # 1. Test Webhook with Invalid Signature
    res = client.post(
        "/api/v1/payments/webhook/",
        data=json.dumps({
            "event": "charge.success",
            "data": {
                "reference": "ref_xyz123",
                "status": "success"
            }
        }),
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE="invalid_signature"
    )
    assert res.status_code == 400

    # 2. Test Webhook with Valid Signature
    payload = json.dumps({
        "event": "charge.success",
        "data": {
            "reference": "ref_xyz123",
            "status": "success"
        }
    })
    
    valid_signature = hmac.new(
        paystack_key.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha512
    ).hexdigest()

    res = client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE=valid_signature
    )
    assert res.status_code == 200

    # Verify state updates
    booking.reload()
    payment.reload()
    assert booking.status == "accepted"
    assert booking.payment_status == "escrowed"
    assert payment.status == "success"

    # 3. Test Webhook Idempotency (replay webhook payload)
    res = client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE=valid_signature
    )
    assert res.status_code == 200

@pytest.mark.django_db
def test_email_dispatch_flow():
    from django.core import mail
    from accounts.email_utils import send_otp_email

    # Clear outbox
    mail.outbox = []

    success = send_otp_email("recipient@example.com", "987654", "Alice")
    assert success is True

    # Assert email was captured in outbox
    assert len(mail.outbox) == 1
    sent_email = mail.outbox[0]
    
    assert sent_email.subject == "987654 is your SkillBridge verification code"
    assert "recipient@example.com" in sent_email.to
    assert "987654" in sent_email.body
    assert "Alice" in sent_email.alternatives[0][0]  # Verify HTML body content

@pytest.mark.django_db
def test_auth_me_patch():
    client = Client()
    user = User(email="test_onboard@example.com", phone="08022222222", role="customer", is_active=True).save()
    auth_headers = get_auth_headers(user)
    
    # Try to onboarding PATCH
    res = client.patch(
        "/api/v1/auth/me/",
        data=json.dumps({
            "full_name": "Test Onboarded User",
            "email": "",
            "is_onboarded": True
        }),
        content_type="application/json",
        **auth_headers
    )
    assert res.status_code == 200
