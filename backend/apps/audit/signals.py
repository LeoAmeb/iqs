"""
Post-save and post-delete signals for User and Role models that create
AuditLog entries automatically.
"""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog
from apps.users.constants import RESOURCE_TYPE as USER_RESOURCE_TYPE
from apps.roles.constants import RESOURCE_TYPE as ROLE_RESOURCE_TYPE


def _get_client_ip(request) -> str | None:
    if request is None:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _get_acting_user(request):
    """Return the authenticated user making the request, or None."""
    if request is None:
        return None
    return request.user if request.user.is_authenticated else None


def _create_log(action: str, resource_type: str, resource_id: str, extra_data: dict):
    req = get_current_request()
    AuditLog.objects.create(
        user=_get_acting_user(req),
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=_get_client_ip(req),
        user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
        extra_data=extra_data,
    )


# We import models lazily inside signal handlers to avoid circular imports
# at module-load time.

@receiver(post_save, sender="users.User")
def user_post_save(sender, instance, created: bool, **kwargs):
    """Create an audit log entry whenever a User is saved."""
    action = AuditLog.ACTION_CREATE if created else AuditLog.ACTION_UPDATE
    _create_log(
        action=action,
        resource_type=USER_RESOURCE_TYPE,
        resource_id=str(instance.pk),
        extra_data={
            "email": instance.email,
            "is_active": instance.is_active,
        },
    )


@receiver(post_delete, sender="users.User")
def user_post_delete(sender, instance, **kwargs):
    """Create an audit log entry whenever a User is deleted."""
    _create_log(
        action=AuditLog.ACTION_DELETE,
        resource_type=USER_RESOURCE_TYPE,
        resource_id=str(instance.pk),
        extra_data={"email": instance.email},
    )


@receiver(post_save, sender="roles.Role")
def role_post_save(sender, instance, created: bool, **kwargs):
    """Create an audit log entry whenever a Role is saved."""
    action = AuditLog.ACTION_CREATE if created else AuditLog.ACTION_UPDATE
    _create_log(
        action=action,
        resource_type=ROLE_RESOURCE_TYPE,
        resource_id=str(instance.pk),
        extra_data={"name": instance.name, "slug": instance.slug},
    )


@receiver(post_delete, sender="roles.Role")
def role_post_delete(sender, instance, **kwargs):
    """Create an audit log entry whenever a Role is deleted."""
    _create_log(
        action=AuditLog.ACTION_DELETE,
        resource_type=ROLE_RESOURCE_TYPE,
        resource_id=str(instance.pk),
        extra_data={"name": instance.name},
    )
