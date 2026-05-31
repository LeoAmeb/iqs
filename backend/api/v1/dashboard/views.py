from datetime import timedelta

from celery.app.control import Control
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.audit.serializers import AuditLogSerializer
from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from apps.audit.models import AuditLog
from apps.dashboard.constants import Permissions
from apps.roles.models import Role
from apps.users.models import User


@extend_schema(
    tags=["Dashboard"],
    responses={
        200: inline_serializer(
            name="DashboardStats",
            fields={
                "total_users": serializers.IntegerField(),
                "active_users": serializers.IntegerField(),
                "new_users_30d": serializers.IntegerField(),
                "roles_count": serializers.IntegerField(),
                "recent_activity": AuditLogSerializer(many=True),
            },
        )
    },
    description="Returns high-level platform statistics for the admin dashboard.",
)
class DashboardStatsView(APIView):
    permission_classes = [require_permission(Permissions.VIEW)]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        recent_activity = AuditLog.objects.select_related("user").order_by("-created_at")[:5]

        return Response(
            {
                "total_users": User.objects.count(),
                "active_users": User.objects.filter(is_active=True).count(),
                "new_users_30d": User.objects.filter(created_at__gte=thirty_days_ago).count(),
                "roles_count": Role.objects.count(),
                "recent_activity": AuditLogSerializer(recent_activity, many=True).data,
            }
        )


@extend_schema(
    tags=["Dashboard"],
    request=None,
    responses={
        200: inline_serializer(
            name="CeleryPingResponse",
            fields={
                "task_id": serializers.CharField(),
                "status": serializers.CharField(),
                "workers": serializers.ListField(child=serializers.CharField()),
            },
        )
    },
    description=(
        "Dispatches a no-op task to Celery and pings all active workers. "
        "Use this to verify the broker connection and worker availability."
    ),
)
class CeleryPingView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def post(self, request):
        from config.celery import app as celery_app, debug_task

        # Ping workers with a 1-second timeout to collect active hostnames
        control = Control(celery_app)
        ping_responses = control.ping(timeout=1.0) or []
        workers = [list(r.keys())[0] for r in ping_responses if r]

        # Dispatch a no-op task so we can confirm it reaches the queue
        task = debug_task.delay()

        return Response(
            {
                "task_id": task.id,
                "status": "queued",
                "workers": workers,
            },
            status=status.HTTP_200_OK,
        )
