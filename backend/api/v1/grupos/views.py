from django.contrib.auth.models import Group, Permission
from django.db.models import Q
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from api.v1.grupos.serializers import GrupoSerializer, GrupoWriteSerializer, PermissionSerializer
from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog

GRUPOS_RESOURCE_TYPE = "Grupo"

ALLOWED_APP_LABELS = ["users", "audit", "dashboard", "clientes", "productos", "ventas"]


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _permisos_queryset():
    return Permission.objects.filter(
        Q(content_type__app_label__in=ALLOWED_APP_LABELS)
        | Q(content_type__app_label="auth", content_type__model="group")
    ).select_related("content_type").order_by("content_type__app_label", "codename")


class GrupoViewSet(ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions__content_type").all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("auth.view_group")()]
        if self.action == "create":
            return [require_permission("auth.add_group")()]
        if self.action in ("update", "partial_update"):
            return [require_permission("auth.change_group")()]
        if self.action == "destroy":
            return [require_permission("auth.delete_group")()]
        return [IsAdminOrSuperuser()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GrupoWriteSerializer
        return GrupoSerializer

    def perform_create(self, serializer):
        group = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_CREATE,
            resource_type=GRUPOS_RESOURCE_TYPE,
            resource_id=str(group.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"name": group.name},
        )

    def perform_update(self, serializer):
        group = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_UPDATE,
            resource_type=GRUPOS_RESOURCE_TYPE,
            resource_id=str(group.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"name": group.name},
        )

    def perform_destroy(self, instance):
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_DELETE,
            resource_type=GRUPOS_RESOURCE_TYPE,
            resource_id=str(instance.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"name": instance.name},
        )
        instance.delete()


class PermissionViewSet(ReadOnlyModelViewSet):
    """Lista de permisos disponibles para asignar a grupos."""

    permission_classes = [require_permission("auth.view_group")]
    queryset = _permisos_queryset()
    serializer_class = PermissionSerializer
    pagination_class = None
