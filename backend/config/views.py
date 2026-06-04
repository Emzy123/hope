from django.http import JsonResponse
from mongoengine.connection import get_db

def health_check(request):
    """
    API Health Check Endpoint.
    Pings MongoDB to confirm database connectivity.
    """
    try:
        # Ping the default MongoDB database to check connectivity
        db = get_db()
        db.command('ping')
        return JsonResponse({
            "status": "ok",
            "db": "connected"
        }, status=200)
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "db": "disconnected",
            "error": str(e)
        }, status=503)
