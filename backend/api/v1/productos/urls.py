from django.urls import path
from rest_framework.routers import DefaultRouter

from api.v1.productos.views import (
    CategoriaViewSet,
    ConfiguracionSistemaView,
    CotizadorConfigView,
    ProductoViewSet,
)

router = DefaultRouter()
router.register("categorias", CategoriaViewSet, basename="categoria")
router.register("productos", ProductoViewSet, basename="producto")

urlpatterns = [
    path("productos/cotizador/", CotizadorConfigView.as_view(), name="cotizador-config"),
    path("productos/configuracion/", ConfiguracionSistemaView.as_view(), name="configuracion-sistema"),
    *router.urls,
]
