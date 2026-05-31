from rest_framework.routers import DefaultRouter

from api.v1.audit.views import AuditLogViewSet

router = DefaultRouter()
router.register("audit", AuditLogViewSet, basename="auditlog")

urlpatterns = router.urls
