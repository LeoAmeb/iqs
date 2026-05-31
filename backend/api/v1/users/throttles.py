"""
Custom throttle classes for authentication endpoints.
Rates are configured in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
"""
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limit login attempts per IP to prevent brute-force attacks."""
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Limit registration requests per IP."""
    scope = "register"


class PasswordResetRateThrottle(AnonRateThrottle):
    """Limit password reset requests per IP."""
    scope = "password_reset"
