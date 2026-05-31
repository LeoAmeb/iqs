from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ReadOnlyModelViewSet

from api.v1.audit.filters import AuditLogFilter
from api.v1.audit.serializers import AuditLogSerializer
from api.v1.users.permissions import require_permission
from apps.audit.constants import Permissions
from apps.audit.models import AuditLog


class AuditLogViewSet(ReadOnlyModelViewSet):
    """
    Read-only viewset for audit log entries.
    Supports filtering by user_id, action, date_from, date_to
    and searching by resource_type and resource_id.
    """

    permission_classes = [require_permission(Permissions.VIEW)]
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AuditLogFilter
    search_fields = ["resource_type", "resource_id"]
    ordering_fields = ["created_at", "action", "resource_type"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return AuditLog.objects.select_related("user").all()
