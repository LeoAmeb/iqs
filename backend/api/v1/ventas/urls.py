from rest_framework.routers import DefaultRouter

from api.v1.ventas.views import CotizacionItemViewSet, CotizacionViewSet, PedidoViewSet, ProduccionViewSet

router = DefaultRouter()
router.register("cotizaciones", CotizacionViewSet, basename="cotizacion")
router.register("cotizacion-items", CotizacionItemViewSet, basename="cotizacion-item")
router.register("pedidos", PedidoViewSet, basename="pedido")
router.register("produccion", ProduccionViewSet, basename="produccion")

urlpatterns = router.urls
