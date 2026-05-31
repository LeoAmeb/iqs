from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditUserSerializer(serializers.Serializer):
    """Minimal user representation embedded in audit log entries."""

    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class AuditLogSerializer(serializers.ModelSerializer):
    """Full audit log entry serializer with nested user."""

    user = AuditUserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "action",
            "resource_type",
            "resource_id",
            "ip_address",
            "user_agent",
            "extra_data",
            "created_at",
        ]
        read_only_fields = fields
