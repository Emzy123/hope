import os
import sys
from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Add apps/ directory to the python path to support direct app imports
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))

# Environment variables
SECRET_KEY = config('SECRET_KEY', default='django-insecure-0!tlypz(i9m-_=umm+ego-@_+)8r^e*@3x6@0+ol+3fy$*jgm$')
DEBUG = config('DEBUG', default=True, cast=bool)

# Host definitions
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third Party Libraries
    'rest_framework',
    'corsheaders',
    
    # Custom Apps
    'accounts',
    'workers',
    'categories',
    'bookings',
    'payments',
    'reviews',
    'notifications',
    'chat',
    'admin_panel',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Needs to be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration
# We disable traditional Django relational migrations for our MongoDB apps.
MIGRATION_MODULES = {
    'accounts': None,
    'workers': None,
    'categories': None,
    'bookings': None,
    'payments': None,
    'reviews': None,
    'notifications': None,
    'chat': None,
    'admin_panel': None,
}

# We keep a dummy sqlite database setup for Django's admin sessions / auth if needed,
# but all actual data models will use mongoengine.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS Configurations ---
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.onrender\.com$",
    r"^http://localhost:\d+$",
    r"^http://127\.0.0.1:\d+$",
]
CORS_ALLOW_CREDENTIALS = True

# --- mongoengine MongoDB Connection Setup ---
import mongoengine
MONGODB_URI = config('MONGODB_URI', default='mongodb://localhost:27017/skillbridge')
try:
    mongoengine.connect(host=MONGODB_URI)
    print(f"Successfully connected to MongoDB via mongoengine.")
except Exception as e:
    print(f"MongoDB connection failed: {e}")

# --- REST Framework Configuration ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# --- SimpleJWT Cookies Configuration ---
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Custom JWT in Cookie settings
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_REFRESH': 'refresh_token',
    'AUTH_COOKIE_SECURE': config('JWT_COOKIE_SECURE', default=False, cast=bool),
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Strict',
}

# --- Paystack API Configuration ---
PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY', default='sk_test_sample')

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


