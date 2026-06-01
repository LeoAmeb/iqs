from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from api.v1.users.filters import UserFilter
from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from api.v1.users.serializers import (
    UserCreateSerializer,
    UserMeSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from api.v1.users.throttles import LoginRateThrottle
from apps.audit.middleware import get_current_request
from apps.audit.models import AuditLog
from apps.users.constants import Permissions, RESOURCE_TYPE
from apps.users.models import User


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@extend_schema(tags=["Users"])
class UserViewSet(ModelViewSet):
    """CRUD for users. All actions require IsAdminOrSuperuser except `me`."""

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = UserFilter
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["email", "created_at", "is_active"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return User.objects.prefetch_related("groups__permissions").all()

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        if self.action == "me":
            return UserMeSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == "me":
            return [IsAuthenticated()]
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
        user = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_CREATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(user.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"email": user.email},
        )

    def perform_update(self, serializer):
        user = serializer.save()
        req = get_current_request()
        AuditLog.objects.create(
            user=req.user if req and req.user.is_authenticated else None,
            action=AuditLog.ACTION_UPDATE,
            resource_type=RESOURCE_TYPE,
            resource_id=str(user.pk),
            ip_address=_get_client_ip(req) if req else None,
            user_agent=req.META.get("HTTP_USER_AGENT", "") if req else "",
            extra_data={"email": user.email},
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
            extra_data={"email": instance.email},
        )
        instance.delete()

    @extend_schema(
        responses={200: UserMeSerializer},
        description="Return the profile and permissions of the currently authenticated user.",
    )
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return the currently authenticated user's profile."""
        serializer = UserMeSerializer(request.user, context={"request": request})
        return Response(serializer.data)
