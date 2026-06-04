import json
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from common_serializers import document_to_dict
from workers.models import WorkerProfile
from categories.models import Category
from bookings.models import Booking
from auth_utils import require_auth, get_request_user
from admin_panel.models import log_admin_action


def worker_list(request):
    """
    GET /api/v1/workers/ — public listing of approved workers (or all workers for admin).
    Query params: city, category (slug), search
    """
    user = get_request_user(request)
    if user and user.role == "admin":
        filters = {}
    else:
        filters = {"is_approved": True, "is_available": True}
        
    city = request.GET.get("city")
    if city:
        filters["city__iexact"] = city

    workers = WorkerProfile.objects(**filters).order_by("-rating_avg")
    data = []
    for worker in workers:
        active_jobs = Booking.objects(worker=worker, status__in=["accepted", "in_progress", "completed_by_worker", "disputed"]).count()
        if active_jobs >= 3:
            if not (user and user.role == "admin"):
                continue

        item = document_to_dict(
            worker,
            [
                "bio",
                "city",
                "state",
                "hourly_rate",
                "rating_avg",
                "rating_count",
                "portfolio_urls",
                "avatar_url",
                "is_available",
                "is_approved",
            ],
        )
        item["id"] = str(worker.id)
        item["full_name"] = worker.user.full_name if worker.user else ""
        item["user_id"] = str(worker.user.id) if worker.user else None
        # Serialize categories
        item["categories"] = [
            {"id": str(c.id), "name": c.name, "slug": c.slug}
            for c in (worker.categories or [])
            if c is not None
        ]
        data.append(item)
    return JsonResponse({"results": data})


@csrf_exempt
@require_auth("worker")
def my_worker_profile(request):
    """
    GET  /api/v1/workers/my-profile/   — fetch authenticated worker's own profile
    PATCH /api/v1/workers/my-profile/  — update bio, city, rate, availability
    POST /api/v1/workers/profile/      — create profile on initial onboarding
    """
    user = request.skillbridge_user

    if request.method == "GET":
        profile = WorkerProfile.objects(user=user).first()
        if not profile:
            return JsonResponse({"detail": "Worker profile not found. Complete onboarding."}, status=404)

        data = {
            "id": str(profile.id),
            "full_name": user.full_name,
            "bio": profile.bio,
            "city": profile.city,
            "state": profile.state,
            "hourly_rate": float(profile.hourly_rate or 0),
            "rating_avg": profile.rating_avg,
            "rating_count": profile.rating_count,
            "portfolio_urls": profile.portfolio_urls,
            "is_available": profile.is_available,
            "is_approved": profile.is_approved,
            "avatar_url": profile.avatar_url,
            "categories": [
                {"id": str(c.id), "name": c.name, "slug": c.slug}
                for c in (profile.categories or [])
                if c is not None
            ],
        }
        return JsonResponse({"profile": data})

    if request.method == "PATCH":
        profile = WorkerProfile.objects(user=user).first()
        if not profile:
            return JsonResponse({"detail": "Worker profile not found."}, status=404)

        try:
            data = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            data = {}

        if "bio" in data:
            profile.bio = str(data["bio"])[:500]
        if "city" in data:
            profile.city = str(data["city"])[:80]
        if "state" in data:
            profile.state = str(data["state"])[:80]
        if "hourly_rate" in data:
            try:
                profile.hourly_rate = float(data["hourly_rate"])
            except (ValueError, TypeError):
                pass
        if "is_available" in data:
            profile.is_available = bool(data["is_available"])
        if "categories" in data and isinstance(data["categories"], list):
            cat_slugs = [str(s) for s in data["categories"]]
            cats = list(Category.objects(slug__in=cat_slugs))
            profile.categories = cats

        profile.save()
        return JsonResponse({"detail": "Profile updated."})

    return JsonResponse({"detail": "Method not allowed."}, status=405)


@csrf_exempt
@require_auth("worker")
def create_worker_profile(request):
    """
    POST /api/v1/workers/profile/ — create a new worker profile during onboarding.
    Body: { bio, city, state, hourly_rate, category_slugs: [], portfolio_urls: [] }
    Idempotent: if profile already exists, updates it instead.
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        data = {}

    bio = str(data.get("bio") or "").strip()[:500]
    city = str(data.get("city") or "Lagos").strip()[:80]
    state = str(data.get("state") or "Lagos").strip()[:80]
    hourly_rate = data.get("hourly_rate", 0)
    try:
        hourly_rate = float(hourly_rate)
    except (ValueError, TypeError):
        hourly_rate = 0

    category_slugs = data.get("category_slugs", [])
    portfolio_urls = data.get("portfolio_urls", [])

    cats = list(Category.objects(slug__in=category_slugs)) if category_slugs else []

    # Upsert
    profile = WorkerProfile.objects(user=user).first()
    if profile:
        profile.bio = bio or profile.bio
        profile.city = city
        profile.state = state
        profile.hourly_rate = hourly_rate or profile.hourly_rate
        if cats:
            profile.categories = cats
        if portfolio_urls:
            profile.portfolio_urls = portfolio_urls
        profile.save()
    else:
        profile = WorkerProfile(
            user=user,
            bio=bio,
            city=city,
            state=state,
            hourly_rate=hourly_rate,
            categories=cats,
            portfolio_urls=portfolio_urls,
            is_available=True,
            is_approved=False,  # Must go through admin approval
        ).save()

    return JsonResponse({
        "detail": "Worker profile created. Pending admin review.",
        "profile_id": str(profile.id),
        "is_approved": profile.is_approved,
    }, status=201)


@csrf_exempt
@require_auth("worker")
def toggle_availability(request):
    """
    PATCH /api/v1/workers/availability/ — toggle is_available for the authenticated worker.
    """
    if request.method != "PATCH":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    profile = WorkerProfile.objects(user=user).first()
    if not profile:
        return JsonResponse({"detail": "Worker profile not found."}, status=404)

    try:
        data = json.loads(request.body or "{}")
        is_available = bool(data.get("is_available", not profile.is_available))
    except (json.JSONDecodeError, TypeError):
        is_available = not profile.is_available

    profile.is_available = is_available
    profile.save()

    return JsonResponse({"is_available": profile.is_available})


@csrf_exempt
@require_auth("admin")
def admin_approve_worker(request, worker_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)
    
    profile = WorkerProfile.objects(id=worker_id).first()
    if not profile:
        return JsonResponse({"detail": "Worker profile not found."}, status=404)
        
    profile.is_approved = True
    profile.save()
    
    log_admin_action(
        request.skillbridge_user,
        "Worker Approved",
        f"Approved worker {profile.user.full_name if profile.user else 'Artisan'} (ID: {worker_id})"
    )
    
    return JsonResponse({"detail": "Worker application approved successfully!"})


@csrf_exempt
@require_auth("admin")
def admin_reject_worker(request, worker_id):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)
    
    profile = WorkerProfile.objects(id=worker_id).first()
    if not profile:
        return JsonResponse({"detail": "Worker profile not found."}, status=404)
        
    profile.is_approved = False
    profile.save()
    
    log_admin_action(
        request.skillbridge_user,
        "Worker Rejected",
        f"Rejected worker {profile.user.full_name if profile.user else 'Artisan'} (ID: {worker_id})"
    )
    
    return JsonResponse({"detail": "Worker application rejected."})


import os
from django.conf import settings

@csrf_exempt
@require_auth("worker")
def upload_avatar(request):
    """
    POST /api/v1/workers/my-profile/avatar/ — upload worker profile picture
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)

    user = request.skillbridge_user
    profile = WorkerProfile.objects(user=user).first()
    if not profile:
        return JsonResponse({"detail": "Worker profile not found."}, status=404)

    file = request.FILES.get("avatar")
    if not file:
        return JsonResponse({"detail": "No image file provided."}, status=400)

    # Check file size (e.g. limit to 5MB)
    if file.size > 5 * 1024 * 1024:
        return JsonResponse({"detail": "Image file size exceeds the 5MB limit."}, status=400)

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        return JsonResponse({"detail": "Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed."}, status=400)

    # Ensure media/avatars directory exists
    os.makedirs(os.path.join(settings.MEDIA_ROOT, "avatars"), exist_ok=True)
    filename = f"avatar_{profile.id}{ext}"
    filepath = os.path.join(settings.MEDIA_ROOT, "avatars", filename)

    # Save file on local disk
    with open(filepath, "wb+") as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    profile.avatar_url = f"/media/avatars/{filename}"
    profile.save()

    return JsonResponse({
        "detail": "Profile picture uploaded successfully.",
        "avatar_url": profile.avatar_url
    })

