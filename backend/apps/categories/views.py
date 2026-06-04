import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from categories.models import Category
from common_serializers import document_to_dict
from auth_utils import require_auth, get_request_user
from admin_panel.models import log_admin_action

def category_list(request):
    user = get_request_user(request)
    if user and user.role == "admin":
        categories = Category.objects.order_by("name")
    else:
        categories = Category.objects(is_active=True).order_by("name")
    data = [
        document_to_dict(category, ["name", "slug", "description", "icon", "parent", "is_active"])
        for category in categories
    ]
    return JsonResponse({"results": data})


@csrf_exempt
@require_auth("admin")
def admin_create_category(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed."}, status=405)
    
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
        
    name = str(data.get("name") or "").strip()
    slug = str(data.get("slug") or "").strip().lower()
    
    if not name or not slug:
        return JsonResponse({"detail": "Name and slug are required."}, status=400)
        
    if Category.objects(slug=slug).first():
        return JsonResponse({"detail": "Category with this slug already exists."}, status=400)
        
    category = Category(
        name=name,
        slug=slug,
        description=data.get("description", ""),
        icon=data.get("icon", "wrench"),
        is_active=True
    ).save()
    
    log_admin_action(
        request.skillbridge_user,
        "Category Created",
        f"Created category '{category.name}' (slug: {category.slug})"
    )
    
    return JsonResponse({"category": document_to_dict(category, ["name", "slug", "description", "icon", "is_active"])}, status=201)


@csrf_exempt
@require_auth("admin")
def admin_update_category(request, category_id):
    if request.method != "PATCH":
        return JsonResponse({"detail": "Method not allowed."}, status=405)
        
    category = Category.objects(id=category_id).first()
    if not category:
        return JsonResponse({"detail": "Category not found."}, status=404)
        
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
        
    if "name" in data:
        category.name = str(data["name"]).strip()
    if "slug" in data:
        slug = str(data["slug"]).strip().lower()
        if slug and slug != category.slug:
            if Category.objects(slug=slug).first():
                return JsonResponse({"detail": "Category with this slug already exists."}, status=400)
            category.slug = slug
    if "description" in data:
        category.description = str(data["description"]).strip()
    if "icon" in data:
        category.icon = str(data["icon"]).strip()
    if "is_active" in data:
        category.is_active = bool(data["is_active"])
        
    category.save()
    
    log_admin_action(
        request.skillbridge_user,
        "Category Updated",
        f"Updated category '{category.name}' (is_active: {category.is_active})"
    )
    
    return JsonResponse({"category": document_to_dict(category, ["name", "slug", "description", "icon", "is_active"])})
