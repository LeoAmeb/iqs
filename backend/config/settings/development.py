"""
Development settings — debug mode, permissive CORS, SQLite by default.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# In development, show emails in the console by default (already set in base,
# but be explicit here so it's easy to override).
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# django-extensions (installed only in dev requirements)
INSTALLED_APPS += ["django_extensions"]  # noqa: F405

# Celery — execute tasks eagerly in development so you don't need a broker
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
