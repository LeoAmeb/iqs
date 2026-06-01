"""
Test settings — optimizados para velocidad.
"""

from .development import *  # noqa: F401, F403

# Hasher rápido: evita las 600k iteraciones de PBKDF2 al crear usuarios en factories
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Cache en memoria: no requiere Redis corriendo
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Sesiones en DB durante tests (no dependen de Redis)
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Celery ya está en eager mode por development.py — explícito aquí por claridad
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
