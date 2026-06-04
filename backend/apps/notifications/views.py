import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from auth_utils import require_auth
from notifications.models import Notification

@csrf_exempt
@require_auth("customer", "worker", "admin")
def list_notifications(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    notifications = Notification.objects(user=user).order_by("-created_at")
    
    results = []
    for notif in notifications:
        results.append({
            "id": str(notif.id),
            "title": notif.title,
            "body": notif.body,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat() if notif.created_at else None
        })
        
    return JsonResponse({"results": results})


@csrf_exempt
@require_auth("customer", "worker", "admin")
def mark_read(request, notification_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    notif = Notification.objects(id=notification_id).first()
    if not notif:
        return JsonResponse({"detail": "Notification not found."}, status=404)

    if str(notif.user.id) != str(user.id):
        return JsonResponse({"detail": "Permission denied."}, status=403)

    notif.is_read = True
    notif.save()
    return JsonResponse({"status": "success"})


@csrf_exempt
@require_auth("customer", "worker", "admin")
def mark_all_read(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    Notification.objects(user=user, is_read=False).update(set__is_read=True)
    return JsonResponse({"status": "success"})
