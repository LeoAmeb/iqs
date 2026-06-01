from rest_framework.routers import DefaultRouter

from api.v1.clientes.views import ClienteViewSet

router = DefaultRouter()
router.register("clientes", ClienteViewSet, basename="cliente")

urlpatterns = router.urls
