import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from auth_utils import require_auth
from workers.models import WorkerProfile
from bookings.models import Booking
from admin_panel.models import GlobalSettings, log_admin_action, AuditLog
from decimal import Decimal

def get_settings():
    settings_obj = GlobalSettings.objects.first()
    if not settings_obj:
        settings_obj = GlobalSettings().save()
    return settings_obj


@csrf_exempt
@require_auth("admin")
def admin_settings(request):
    settings_obj = get_settings()

    if request.method == "GET":
        return JsonResponse({
            "commission_rate": float(settings_obj.commission_rate) * 100,
            "otp_expiry_minutes": settings_obj.otp_expiry_minutes,
            "sms_otp_template": settings_obj.sms_otp_template,
            "sms_booking_template": settings_obj.sms_booking_template,
        })

    elif request.method == "PATCH":
        try:
            if request.content_type == "application/json":
                data = json.loads(request.body or "{}")
            else:
                data = request.POST
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON."}, status=400)

        if "commission_rate" in data:
            try:
                commission_rate = float(data["commission_rate"])
                if commission_rate < 0 or commission_rate > 100:
                    return JsonResponse({"detail": "Commission rate must be between 0 and 100."}, status=400)
                settings_obj.commission_rate = Decimal(str(commission_rate / 100.0))
            except (ValueError, TypeError):
                return JsonResponse({"detail": "Invalid commission rate value."}, status=400)

        if "otp_expiry_minutes" in data:
            try:
                otp_expiry = int(data["otp_expiry_minutes"])
                if otp_expiry < 1 or otp_expiry > 60:
                    return JsonResponse({"detail": "OTP expiry must be between 1 and 60 minutes."}, status=400)
                settings_obj.otp_expiry_minutes = otp_expiry
            except (ValueError, TypeError):
                return JsonResponse({"detail": "Invalid OTP expiry value."}, status=400)

        if "sms_otp_template" in data:
            settings_obj.sms_otp_template = str(data["sms_otp_template"]).strip()
        if "sms_booking_template" in data:
            settings_obj.sms_booking_template = str(data["sms_booking_template"]).strip()

        settings_obj.save()

        if "commission_rate" in data:
            try:
                commission_rate = float(data["commission_rate"])
                log_admin_action(
                    request.skillbridge_user,
                    "Settings Updated",
                    f"Updated global platform commission rate to {commission_rate}%"
                )
            except (ValueError, TypeError):
                pass
        else:
            log_admin_action(
                request.skillbridge_user,
                "Settings Updated",
                "Updated global platform settings"
            )

        return JsonResponse({
            "commission_rate": float(settings_obj.commission_rate) * 100,
            "otp_expiry_minutes": settings_obj.otp_expiry_minutes,
            "sms_otp_template": settings_obj.sms_otp_template,
            "sms_booking_template": settings_obj.sms_booking_template,
        })

    else:
        return JsonResponse({"detail": "Method not allowed."}, status=405)


@csrf_exempt
@require_auth("admin")
def admin_dashboard_stats(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)
        
    # Count approved workers
    active_workers_count = WorkerProfile.objects(is_approved=True).count()
    
    # Count pending approvals
    pending_approvals_count = WorkerProfile.objects(is_approved=False).count()
    
    # Count total bookings
    total_bookings_count = Booking.objects.count()
    
    # Calculate revenue (using commission rate from settings)
    settings_obj = get_settings()
    commission = Decimal(str(settings_obj.commission_rate))
    
    done_bookings = Booking.objects(status="done")
    total_revenue = sum(Decimal(str(b.quoted_amount or 0)) for b in done_bookings) * commission
    
    # Count open disputes
    open_disputes_count = Booking.objects(status="disputed").count()
    
    # Simple recent operations log
    recent_disputed = Booking.objects(status="disputed").order_by("-id")[:2]
    recent_workers = WorkerProfile.objects(is_approved=False).order_by("-id")[:2]
    
    operations_log = []
    for b in recent_disputed:
        operations_log.append({
            "text": f"Dispute raised: Booking #{str(b.id)[-6:].upper()}",
            "time": "Awaiting arbitration"
        })
    for w in recent_workers:
        operations_log.append({
            "text": f"New worker NIN application: {w.user.full_name if w.user else 'Worker'}",
            "time": "Awaiting review"
        })

    # Retrieve and merge the latest 10 AuditLog entries
    audit_logs = AuditLog.objects.order_by("-created_at")[:10]
    for log in audit_logs:
        try:
            admin_name = log.admin.full_name if log.admin else "Admin"
        except Exception:
            admin_name = "System/Deleted Admin"
            
        operations_log.append({
            "text": f"[{log.action}] {log.details} (by {admin_name})",
            "time": log.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    if not operations_log:
        operations_log = [
            {"text": "System running smoothly. No warnings.", "time": "Operations green"}
        ]
        
    return JsonResponse({
        "activeWorkers": active_workers_count,
        "totalBookings": total_bookings_count,
        "revenue": float(total_revenue),
        "openDisputes": open_disputes_count,
        "pendingApprovals": pending_approvals_count,
        "operationsLog": operations_log
    })


@csrf_exempt
@require_auth("admin")
def audit_log_list(request):
    """GET: Return paginated audit log entries, newest first."""
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    try:
        page = max(1, int(request.GET.get("page", 1)))
        page_size = min(50, max(1, int(request.GET.get("page_size", 25))))
    except (TypeError, ValueError):
        page = 1
        page_size = 25

    offset = (page - 1) * page_size
    total = AuditLog.objects.count()
    logs = AuditLog.objects.order_by("-created_at")[offset: offset + page_size]

    results = []
    for log in logs:
        try:
            admin_name = log.admin.full_name if log.admin else "System"
            admin_email = log.admin.email if log.admin else ""
        except Exception:
            admin_name = "Deleted Admin"
            admin_email = ""
        results.append({
            "id": str(log.id),
            "admin_name": admin_name,
            "admin_email": admin_email,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return JsonResponse({
        "count": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "results": results,
    })
