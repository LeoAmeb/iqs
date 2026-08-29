from datetime import date, timedelta

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.mixins import (
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from api.v1.ventas.serializers import (
    CotizacionCreateSerializer,
    CotizacionItemUpdateSerializer,
    CotizacionListSerializer,
    CotizacionSerializer,
    PedidoListSerializer,
    PedidoSerializer,
    PedidoUpdateSerializer,
    ProduccionItemSerializer,
    ProduccionItemUpdateSerializer,
)
from apps.ventas.constants import Permissions
from apps.ventas.models import Cotizacion, CotizacionItem, EstatusPedido, Pedido, PedidoItem


@extend_schema(tags=["Cotizaciones"])
class CotizacionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """
    list     — lista cotizaciones paginadas con búsqueda.
    create   — crea Cotizacion + CotizacionItems + Pedido + PedidoItems atómicamente.
    retrieve — retorna la cotización con sus ítems y el pedido_id asociado.
    """

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["nombre_cliente", "telefono", "folio"]
    ordering_fields = ["folio", "created_at", "total"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Cotizacion.objects.select_related("cliente", "creado_por").order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return CotizacionCreateSerializer
        if self.action == "list":
            return CotizacionListSerializer
        return CotizacionSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission(Permissions.COTIZACIONES_VIEW)()]
        return [require_permission(Permissions.COTIZACIONES_CREATE)()]

    def create(self, request, *args, **kwargs):
        serializer = CotizacionCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        cotizacion = serializer.save()
        output = CotizacionSerializer(cotizacion, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        description="Convierte la cotización en un pedido. Sólo puede ejecutarse una vez.",
        responses={201: PedidoSerializer},
    )
    @action(detail=True, methods=["post"], url_path="proceder")
    def proceder(self, request, pk=None):
        cotizacion = self.get_object()

        if hasattr(cotizacion, "pedido"):
            return Response(
                {"detail": "Esta cotización ya tiene un pedido generado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fecha_entrega = cotizacion.fecha_entrega
        if fecha_entrega and (fecha_entrega - date.today()) <= timedelta(days=2):
            estatus_inicial = EstatusPedido.PROXIMO
        else:
            estatus_inicial = EstatusPedido.PENDIENTE

        pedido = Pedido.objects.create(
            folio=cotizacion.folio,
            cotizacion=cotizacion,
            cliente=cotizacion.cliente,
            nombre_cliente=cotizacion.nombre_cliente,
            telefono=cotizacion.telefono,
            fecha_entrega=cotizacion.fecha_entrega,
            hora_entrega=cotizacion.hora_entrega,
            anticipo=cotizacion.anticipo,
            forma_pago=cotizacion.forma_pago,
            notas=cotizacion.notas,
            estatus=estatus_inicial,
            total=cotizacion.total,
            costo=cotizacion.costo,
            creado_por=request.user,
        )

        for item in cotizacion.items.all():
            PedidoItem.objects.create(
                pedido=pedido,
                nombre_producto=item.nombre_producto,
                tipo_calculo=item.tipo_calculo,
                descripcion=item.descripcion,
                cantidad=item.cantidad,
                precio_unit=item.precio_unit,
                total=item.total,
                costo=item.costo,
                detalles=item.detalles,
            )

        output = PedidoSerializer(pedido, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Pedidos"])
class PedidoViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["estatus"]
    search_fields = ["nombre_cliente", "telefono", "folio"]
    ordering_fields = ["folio", "fecha_entrega", "created_at", "estatus"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Pedido.objects.select_related("cliente", "creado_por").prefetch_related(
            "items__logs"
        )
        # Por defecto solo activos; ?todos=1 incluye eliminados
        if self.request.query_params.get("todos") != "1":
            qs = qs.filter(deleted_at__isnull=True)
        # ?pendientes=1 — mismo criterio que "saldo_pendiente" del dashboard:
        # pedidos sin entregar ni cancelar.
        if self.request.query_params.get("pendientes") == "1":
            qs = qs.exclude(estatus__in=[EstatusPedido.ENTREGADO, EstatusPedido.CANCELADO])
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return PedidoListSerializer
        if self.action in ("update", "partial_update"):
            return PedidoUpdateSerializer
        return PedidoSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission(Permissions.PEDIDOS_VIEW)()]
        if self.action in ("update", "partial_update"):
            return [require_permission(Permissions.PEDIDOS_EDIT)()]
        if self.action == "destroy":
            return [require_permission(Permissions.PEDIDOS_DELETE)()]
        return [require_permission(Permissions.PEDIDOS_VIEW)()]

    def destroy(self, request, *args, **kwargs):
        pedido = self.get_object()

        # Admin puede hacer hard delete; empleado solo soft delete
        if request.user.is_superuser or request.user.groups.filter(name="admin").exists():
            pedido.delete()
        else:
            pedido.deleted_at = timezone.now()
            pedido.save(update_fields=["deleted_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    # No se permite crear pedidos directamente — se crean via cotizacion
    http_method_names = ["get", "patch", "delete", "head", "options"]


@extend_schema(tags=["Producción"])
class ProduccionViewSet(ListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet):
    """
    Kanban de producción: lista PedidoItems de pedidos activos.
    PATCH actualiza estatus_produccion y crea PedidoItemLog automáticamente.
    """

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["estatus_produccion"]
    ordering_fields = ["created_at", "pedido__fecha_entrega"]
    ordering = ["pedido__fecha_entrega", "created_at"]

    def get_queryset(self):
        return (
            PedidoItem.objects.select_related("pedido", "pedido__cliente")
            .filter(pedido__deleted_at__isnull=True)
            .order_by("pedido__fecha_entrega", "created_at")
        )

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return ProduccionItemUpdateSerializer
        return ProduccionItemSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission(Permissions.PRODUCCION_VIEW)()]
        return [require_permission(Permissions.PRODUCCION_EDIT)()]


@extend_schema(tags=["Cotizaciones"])
class CotizacionItemViewSet(UpdateModelMixin, GenericViewSet):
    """
    PATCH — actualiza un ítem de cotización y recalcula los totales de la cotización padre.
    """

    http_method_names = ["patch", "head", "options"]

    def get_queryset(self):
        return CotizacionItem.objects.select_related("cotizacion")

    def get_serializer_class(self):
        return CotizacionItemUpdateSerializer

    def get_permissions(self):
        return [require_permission(Permissions.COTIZACIONES_CREATE)()]

    def perform_update(self, serializer):
        if hasattr(serializer.instance.cotizacion, "pedido"):
            raise ValidationError(
                "No se pueden editar los ítems de una cotización que ya fue convertida en pedido."
            )
        super().perform_update(serializer)
