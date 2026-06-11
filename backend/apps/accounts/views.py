import random
import secrets
import re
import json
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import OTPCode, User
from workers.models import WorkerProfile
from auth_utils import require_auth
from admin_panel.models import log_admin_action


PHONE_RE = re.compile(r"^(?:\+234|0)[789][01]\d{8}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_phone(phone):
    phone = str(phone or "").strip().replace(" ", "")
    if phone.startswith("+234"):
        return "0" + phone[4:]
    return phone


def user_payload(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": user.role,
        "is_verified": user.is_verified,
        "is_onboarded": user.is_onboarded,
    }


def request_data(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST


@csrf_exempt
def request_otp(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    data = request_data(request)
    email = str(data.get("email") or "").strip().lower()

    if not email or not EMAIL_RE.match(email):
        return JsonResponse({"detail": "Enter a valid email address."}, status=400)

    # Throttle: one OTP per email per 60 seconds
    existing = OTPCode.objects(email=email).first()
    if existing and (datetime.utcnow() - existing.created_at).total_seconds() < 60:
        return JsonResponse({"detail": "Please wait 60 seconds before requesting a new code."}, status=429)

    code = "123456" if settings.DEBUG else f"{secrets.randbelow(1000000):06d}"
    existing_user = User.objects(email=email).first()
    display_name = (existing_user.full_name if existing_user else "") or data.get("full_name", "") or "there"
    OTPCode.create_code(email=email, code=code)

    if not settings.DEBUG:
        import logging
        _log = logging.getLogger(__name__)
        try:
            from accounts.email_utils import send_otp_email
            ok = send_otp_email(email, code, full_name=str(display_name))
            if not ok:
                _log.error("OTP email delivery failed for %s via Brevo.", email)
        except Exception as exc:
            _log.error("OTP email exception for %s: %s", email, exc)

    response = {"detail": "OTP sent."}
    if settings.DEBUG:
        response["dev_otp"] = code
    return JsonResponse(response, status=201)


@csrf_exempt
def verify_otp(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    data = request_data(request)
    email = str(data.get("email") or "").strip().lower()
    code = str(data.get("code") or "").strip()
    full_name = str(data.get("full_name") or "").strip()
    role = str(data.get("role") or "customer").strip()

    if not email or not EMAIL_RE.match(email):
        return JsonResponse({"detail": "A valid email is required."}, status=400)

    otp = OTPCode.objects(email=email).first()
    valid_dev_code = settings.DEBUG and code == "123456"
    valid_saved_code = otp and otp.code == code and otp.expires_at > datetime.utcnow()

    if not valid_dev_code and not valid_saved_code:
        if otp:
            otp.update(inc__attempts=1)
            otp = OTPCode.objects(email=email).first()
            if otp and (otp.attempts or 0) >= 5:
                otp.delete()
                return JsonResponse({"detail": "Too many failed attempts. This OTP is now invalid."}, status=400)
        return JsonResponse({"detail": "Invalid or expired OTP."}, status=400)

    if role not in User.ROLE_CHOICES:
        return JsonResponse({"detail": "Invalid role."}, status=400)

    user = User.objects(email=email).first()

    if user is None:
        user = User(
            email=email,
            full_name=full_name,
            role=role,
            is_verified=True,
            is_onboarded=False,
        ).save()
    else:
        if full_name:
            user.full_name = full_name
        user.is_verified = True
        user.save()

    OTPCode.objects(email=email).delete()
    refresh = RefreshToken()
    refresh["user_id"] = str(user.id)
    refresh["phone"] = user.phone
    refresh["role"] = user.role

    response = JsonResponse({"user": user_payload(user)}, status=200)
    response.set_cookie(
        settings.SIMPLE_JWT["AUTH_COOKIE"],
        str(refresh.access_token),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
    )
    response.set_cookie(
        settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
        str(refresh),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
    )
    return response


@csrf_exempt
def logout(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    response = JsonResponse({"detail": "Logged out."})
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"], path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"])
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"], path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"])
    return response


@csrf_exempt
@require_auth()
def auth_me(request):
    """
    GET:  Returns the current authenticated user payload.
    PATCH: Update profile fields — full_name, email, is_onboarded.
    """
    if request.method == "GET":
        return JsonResponse({"user": user_payload(request.skillbridge_user)})

    if request.method == "PATCH":
        data = request_data(request)
        user = request.skillbridge_user

        if "full_name" in data:
            name = str(data["full_name"]).strip()
            if len(name) >= 2:
                user.full_name = name

        if "email" in data:
            user.email = str(data["email"]).strip() or None

        if "is_onboarded" in data:
            is_onboarded = bool(data["is_onboarded"])
            user.is_onboarded = is_onboarded
            if not is_onboarded:
                # User is skipping — record the timestamp
                user.onboarding_skipped_at = datetime.utcnow()

        user.save()
        return JsonResponse({"user": user_payload(user)})

    return JsonResponse({"detail": "Method not allowed."}, status=405)


@csrf_exempt
def admin_login(request):
    """
    Password-based login exclusively for admin accounts.
    Accepts: { email, password }
    Returns JWT cookies identical to verify_otp on success.
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    data = request_data(request)
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "").strip()

    if not email or not EMAIL_RE.match(email):
        return JsonResponse({"detail": "A valid email address is required."}, status=400)
    if not password:
        return JsonResponse({"detail": "Email and password are required."}, status=400)

    user = User.objects(email=email, role="admin").first()
    if not user or not user.check_password(password):
        return JsonResponse({"detail": "Invalid credentials."}, status=401)

    if not user.is_active:
        return JsonResponse({"detail": "This account has been deactivated."}, status=403)

    refresh = RefreshToken()
    refresh["user_id"] = str(user.id)
    refresh["phone"] = user.phone
    refresh["role"] = user.role

    response = JsonResponse({"user": user_payload(user)}, status=200)
    response.set_cookie(
        settings.SIMPLE_JWT["AUTH_COOKIE"],
        str(refresh.access_token),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
    )
    response.set_cookie(
        settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
        str(refresh),
        httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
        secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
        samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
    )
    return response


@csrf_exempt
def admin_reset_password_request(request):
    """
    POST /api/v1/auth/admin-reset-password/request/ — request OTP to reset admin password.
    Body: { email }
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    data = request_data(request)
    email = str(data.get("email") or "").strip().lower()

    if not email or not EMAIL_RE.match(email):
        return JsonResponse({"detail": "A valid email address is required."}, status=400)

    user = User.objects(email=email, role="admin", is_active=True).first()
    if not user:
        return JsonResponse({"detail": "No active administrator account with this email address was found."}, status=404)

    existing = OTPCode.objects(email=email).first()
    if existing and (datetime.utcnow() - existing.created_at).total_seconds() < 60:
        return JsonResponse({"detail": "Please wait 60 seconds before requesting a new verification code."}, status=429)

    code = "123456" if settings.DEBUG else f"{random.randint(100000, 999999)}"
    OTPCode.create_code(email=email, code=code)

    if not settings.DEBUG:
        import logging
        _log = logging.getLogger(__name__)
        try:
            from accounts.email_utils import send_otp_email
            ok = send_otp_email(email, code, full_name=user.full_name or "Administrator")
            if not ok:
                _log.error("Admin reset OTP email delivery failed for %s via Brevo.", email)
        except Exception as exc:
            _log.error("Admin reset OTP email exception for %s: %s", email, exc)

    response = {"detail": "Verification code sent to your registered email address."}
    if settings.DEBUG:
        response["dev_otp"] = code
    return JsonResponse(response, status=200)


@csrf_exempt
def admin_reset_password_confirm(request):
    """
    POST /api/v1/auth/admin-reset-password/confirm/ — verify code and update password.
    Body: { email, code, new_password }
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    data = request_data(request)
    email = str(data.get("email") or "").strip().lower()
    code = str(data.get("code") or "").strip()
    new_password = str(data.get("new_password") or "").strip()

    if not email or not EMAIL_RE.match(email):
        return JsonResponse({"detail": "A valid email address is required."}, status=400)
    if not code or not new_password:
        return JsonResponse({"detail": "Email, verification code, and new password are required."}, status=400)

    if len(new_password) < 8:
        return JsonResponse({"detail": "New password must be at least 8 characters long."}, status=400)

    user = User.objects(email=email, role="admin", is_active=True).first()
    if not user:
        return JsonResponse({"detail": "No active administrator account with this email address was found."}, status=404)

    otp = OTPCode.objects(email=email).first()
    valid_dev_code = settings.DEBUG and code == "123456"
    valid_saved_code = otp and otp.code == code and otp.expires_at > datetime.utcnow()

    if not valid_dev_code and not valid_saved_code:
        return JsonResponse({"detail": "Invalid or expired verification code."}, status=400)

    user.set_password(new_password)
    user.save()

    OTPCode.objects(email=email).delete()

    log_admin_action(
        user,
        "Password Reset",
        f"Administrator {user.email} successfully updated their login password."
    )

    return JsonResponse({"detail": "Your administrative password has been updated successfully."}, status=200)


@csrf_exempt
@require_auth("admin")
def admin_users_list_create(request):
    """
    GET: List all users in the system, with optional search and role filtering.
    POST: Create a user of any role directly.
    """
    if request.method == "GET":
        role_filter = request.GET.get("role", "").strip().lower()
        search_query = request.GET.get("search", "").strip()

        users = User.objects()

        if role_filter in User.ROLE_CHOICES:
            users = users.filter(role=role_filter)

        if search_query:
            users = users.filter(
                phone__icontains=search_query
            ) | users.filter(
                full_name__icontains=search_query
            ) | users.filter(
                email__icontains=search_query
            )

        user_list = []
        for u in users.order_by("-created_at"):
            user_list.append({
                "id": str(u.id),
                "phone": u.phone,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "is_onboarded": u.is_onboarded,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            })

        return JsonResponse({"results": user_list}, status=200)

    elif request.method == "POST":
        data = request_data(request)
        phone = normalize_phone(data.get("phone") or "")
        full_name = str(data.get("full_name") or "").strip()
        email = str(data.get("email") or "").strip().lower()
        role = str(data.get("role") or "customer").strip().lower()
        password = str(data.get("password") or "").strip()

        if not email or not EMAIL_RE.match(email):
            return JsonResponse({"detail": "Enter a valid email address."}, status=400)

        if phone and not PHONE_RE.match(phone):
            return JsonResponse({"detail": "Enter a valid Nigerian phone number."}, status=400)

        if role not in User.ROLE_CHOICES:
            return JsonResponse({"detail": "Invalid role specified."}, status=400)

        if User.objects(email=email).first():
            return JsonResponse({"detail": "A user with this email address already exists."}, status=400)

        user = User(
            email=email,
            phone=phone or None,
            full_name=full_name,
            role=role,
            is_active=True,
            is_verified=True,
            is_onboarded=True,
        )

        if role == "admin":
            if not password or len(password) < 8:
                return JsonResponse({"detail": "Admin password must be at least 8 characters."}, status=400)
            user.set_password(password)

        user.save()

        # If worker, auto-create a basic WorkerProfile using the real model
        if role == "worker":
            from categories.models import Category
            existing = WorkerProfile.objects(user=user).first()
            if not existing:
                WorkerProfile(
                    user=user,
                    bio="Experienced local professional.",
                    city="Lagos",
                    state="Lagos",
                    hourly_rate=5000,
                    is_available=True,
                    is_approved=True,  # admin-created workers auto-approved
                ).save()

        return JsonResponse({
            "detail": "User created successfully.",
            "user": {
                "id": str(user.id),
                "phone": user.phone,
                "full_name": user.full_name,
                "role": user.role,
            }
        }, status=201)

    return JsonResponse({"detail": "Method not allowed."}, status=405)


@csrf_exempt
@require_auth("admin")
def admin_users_toggle_active(request, user_id):
    """
    POST: Toggle the is_active status of a user.
    """
    if request.method not in ("POST", "PATCH"):
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = User.objects(id=user_id).first()
    if not user:
        return JsonResponse({"detail": "User not found."}, status=404)

    if str(user.id) == str(request.skillbridge_user.id):
        return JsonResponse({"detail": "You cannot deactivate your own administrative account."}, status=400)

    user.is_active = not user.is_active
    user.save()

    log_admin_action(
        request.skillbridge_user,
        "User Status Toggled",
        f"Toggled user {user.email} active status to {user.is_active}"
    )

    return JsonResponse({
        "detail": "User status toggled successfully.",
        "user_id": str(user.id),
        "is_active": user.is_active
    }, status=200)
