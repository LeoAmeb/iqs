from rest_framework import serializers

from apps.roles.models import Permission, Role


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "codename", "name", "category"]


class RoleSerializer(serializers.ModelSerializer):
    """Full role representation with nested permissions and user count."""

    permissions = PermissionSerializer(many=True, read_only=True)
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "permissions",
            "users_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_users_count(self, obj: Role) -> int:
        return obj.users.count()


class RoleWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating a role including M2M permission assignment."""

    permission_ids = serializers.PrimaryKeyRelatedField(
        source="permissions",
        queryset=Permission.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Role
        fields = ["name", "description", "permission_ids"]

    def create(self, validated_data: dict) -> Role:
        permissions = validated_data.pop("permissions", [])
        role = Role.objects.create(**validated_data)
        role.permissions.set(permissions)
        return role

    def update(self, instance: Role, validated_data: dict) -> Role:
        permissions = validated_data.pop("permissions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance

    def to_representation(self, instance: Role) -> dict:
        return RoleSerializer(instance, context=self.context).data
