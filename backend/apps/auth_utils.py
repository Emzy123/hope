from functools import wraps
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import User


def get_request_user(request):
    token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])
    auth_header = request.headers.get("Authorization", "")
    if not token and auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        return None
    try:
        access_token = AccessToken(token)
    except (InvalidToken, TokenError):
        return None
    user_id = access_token.get("user_id")
    if not user_id:
        return None
    return User.objects(id=user_id, is_active=True).first()


def require_auth(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = get_request_user(request)
            if user is None:
                return JsonResponse({"detail": "Authentication required."}, status=401)
            if roles and user.role not in roles:
                return JsonResponse({"detail": "Permission denied."}, status=403)
            request.skillbridge_user = user
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
