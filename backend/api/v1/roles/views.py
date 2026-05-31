from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from api.v1.roles.serializers import PermissionSerializer, RoleSerializer, RoleWriteSerializer
from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog
from apps.roles.constants import Permissions, RESOURCE_TYPE
from apps.roles.models import Permission, Role


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class RoleViewSet(ModelViewSet):
    """CRUD for roles with action-level permission guards."""

    queryset = Role.objects.prefetch_related("permissions", "users").all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission(Permissions.VIEW)()]
        if self.action == "create":
            return [require_permission(Permissions.CREATE)()]
        if self.action in ("update", "partial_update"):
            return [require_permission(Permissions.EDIT)()]
        if self.action == "destroy":
            return [require_permission(Permissions.DELETE)()]
        return [IsAdminOrSuperuser()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RoleWriteSerializer
        return RoleSerializer

    def perform_create(self, serializer):
        role = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_CREATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(role.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"name": role.name},
        )

    def perform_update(self, serializer):
        role = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_UPDATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(role.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"name": role.name},
        )

    def perform_destroy(self, instance):
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_DELETE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(instance.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"name": instance.name},
        )
        instance.delete()


class PermissionViewSet(ReadOnlyModelViewSet):
    """Read-only viewset for permissions. Returns a flat list; grouping is done client-side."""

    permission_classes = [require_permission(Permissions.VIEW)]
    queryset = Permission.objects.all().order_by("category", "codename")
    serializer_class = PermissionSerializer
    pagination_class = None  # Return all permissions in a single flat array
