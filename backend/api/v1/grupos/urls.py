from rest_framework.routers import DefaultRouter

from api.v1.grupos.views import GrupoViewSet, PermissionViewSet

router = DefaultRouter()
router.register("grupos", GrupoViewSet, basename="grupo")
router.register("permisos", PermissionViewSet, basename="permiso")

urlpatterns = router.urls
