from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from api.v1.clientes.serializers import ClienteSerializer, ClienteWriteSerializer
from api.v1.users.permissions import require_permission
from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog
from apps.clientes.constants import Permissions, RESOURCE_TYPE
from apps.clientes.models import Cliente


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@extend_schema(tags=["Clientes"])
class ClienteViewSet(ModelViewSet):
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["nombre", "telefono", "email"]
    ordering_fields = ["nombre", "created_at"]
    ordering = ["nombre"]

    def get_queryset(self):
        return Cliente.objects.all()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ClienteWriteSerializer
        return ClienteSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "historial"):
            return [require_permission(Permissions.VIEW)()]
        if self.action == "create":
            return [require_permission(Permissions.CREATE)()]
        if self.action in ("update", "partial_update"):
            return [require_permission(Permissions.EDIT)()]
        if self.action == "destroy":
            return [require_permission(Permissions.DELETE)()]
        return [require_permission(Permissions.VIEW)()]

    def perform_create(self, serializer):
        cliente = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_CREATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(cliente.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": cliente.nombre},
        )

    def perform_update(self, serializer):
        cliente = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_UPDATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(cliente.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": cliente.nombre},
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
            extra_data={"nombre": instance.nombre},
        )
        instance.delete()

    @extend_schema(
        description="Retorna el historial de pedidos del cliente.",
        responses={200: dict},
    )
    @action(detail=True, methods=["get"], url_path="pedidos", url_name="pedidos")
    def historial(self, request, pk=None):
        from api.v1.ventas.serializers import PedidoListSerializer

        cliente = self.get_object()
        pedidos = cliente.pedidos.select_related("creado_por").order_by("-created_at")
        serializer = PedidoListSerializer(pedidos, many=True)
        return Response(serializer.data)
