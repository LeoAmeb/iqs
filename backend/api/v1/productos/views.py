from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from api.v1.productos.serializers import (
    CategoriaSerializer,
    CategoriaWriteSerializer,
    ConfiguracionSistemaSerializer,
    ProductoSerializer,
    ProductoWriteSerializer,
)
from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog
from apps.productos.constants import CATEGORIA_RESOURCE_TYPE, Permissions, RESOURCE_TYPE
from apps.productos.models import Categoria, ConfiguracionSistema, Producto


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@extend_schema(tags=["Categorías"])
class CategoriaViewSet(ModelViewSet):
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre", "orden"]
    ordering = ["orden", "nombre"]

    def get_queryset(self):
        return Categoria.objects.all()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CategoriaWriteSerializer
        return CategoriaSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission(Permissions.VIEW)()]
        return [IsAdminOrSuperuser()]

    def perform_create(self, serializer):
        categoria = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_CREATE,
            resource_type=CATEGORIA_RESOURCE_TYPE,
            resource_id=str(categoria.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": categoria.nombre},
        )

    def perform_update(self, serializer):
        categoria = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_UPDATE,
            resource_type=CATEGORIA_RESOURCE_TYPE,
            resource_id=str(categoria.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": categoria.nombre},
        )

    def perform_destroy(self, instance):
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_DELETE,
            resource_type=CATEGORIA_RESOURCE_TYPE,
            resource_id=str(instance.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": instance.nombre},
        )
        instance.delete()

    @extend_schema(
        tags=["Categorías"],
        description="Restaura tipo_calculo y config al estado canónico del negocio.",
    )
    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrSuperuser])
    def restablecer(self, request, pk=None):
        from apps.productos.defaults import CONFIG_BASE

        categoria = self.get_object()
        defaults = CONFIG_BASE.get(categoria.nombre)
        if defaults is None:
            return Response(
                {"detail": "Esta categoría no tiene configuración base disponible."},
                status=status.HTTP_404_NOT_FOUND,
            )
        categoria.tipo_calculo = defaults["tipo_calculo"]
        categoria.config = defaults["config"]
        categoria.save(update_fields=["tipo_calculo", "config"])
        return Response(CategoriaSerializer(categoria).data)


@extend_schema(tags=["Productos"])
class ProductoViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["activo", "tipo_calculo", "categoria"]
    search_fields = ["nombre", "categoria__nombre"]
    ordering_fields = ["nombre", "orden", "categoria__nombre"]
    ordering = ["orden", "nombre"]

    def get_queryset(self):
        return Producto.objects.select_related("categoria").all()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProductoWriteSerializer
        return ProductoSerializer

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

    def perform_create(self, serializer):
        producto = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_CREATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(producto.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": producto.nombre},
        )

    def perform_update(self, serializer):
        producto = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_UPDATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(producto.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"nombre": producto.nombre},
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
    tags=["Productos"],
    description=(
        "Retorna todas las categorías activas con su configuración "
        "junto con los parámetros globales del sistema. "
        "Diseñado para que el cotizador cargue todo en un solo request."
    ),
)
class CotizadorConfigView(APIView):
    """GET /productos/cotizador/ — carga inicial del cotizador."""

    def get(self, request):
        categorias = Categoria.objects.filter(activo=True).order_by("orden", "nombre")
        config = ConfiguracionSistema.get()
        return Response(
            {
                "categorias": CategoriaSerializer(categorias, many=True).data,
                "configuracion": ConfiguracionSistemaSerializer(config).data,
            }
        )


@extend_schema(tags=["Productos"])
class ConfiguracionSistemaView(APIView):
    """GET / PATCH /productos/configuracion/ — solo admin."""

    permission_classes = [IsAdminOrSuperuser]

    def get(self, request):
        config = ConfiguracionSistema.get()
        return Response(ConfiguracionSistemaSerializer(config).data)

    def patch(self, request):
        config = ConfiguracionSistema.get()
        serializer = ConfiguracionSistemaSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
