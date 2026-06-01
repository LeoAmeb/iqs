"""
Señales post-save y post-delete para el modelo User que crean
entradas en AuditLog automáticamente.
"""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog
from apps.users.constants import RESOURCE_TYPE as USER_RESOURCE_TYPE


def _get_client_ip(request) -> str | None:
    if request is None:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _get_acting_user(request):
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


@receiver(post_save, sender="users.User")
def user_post_save(sender, instance, created: bool, **kwargs):
    action = AuditLog.ACTION_CREATE if created else AuditLog.ACTION_UPDATE
    _create_log(
        action=action,
        resource_type=USER_RESOURCE_TYPE,
        resource_id=str(instance.pk),
        extra_data={"email": instance.email, "is_active": instance.is_active},
    )


@receiver(post_delete, sender="users.User")
def user_post_delete(sender, instance, **kwargs):
    _create_log(
        action=AuditLog.ACTION_DELETE,
        resource_type=USER_RESOURCE_TYPE,
        resource_id=str(instance.pk),
        extra_data={"email": instance.email},
    )
