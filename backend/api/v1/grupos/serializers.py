from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

APP_LABEL_DISPLAY: dict[str, str] = {
    "users": "Usuarios",
    "auth": "Grupos",
    "audit": "Auditoría",
    "dashboard": "Dashboard",
    "clientes": "Clientes",
    "productos": "Productos",
    "ventas": "Ventas",
}


class PermissionSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = ["id", "codename", "name", "category"]

    def get_category(self, obj: Permission) -> str:
        return APP_LABEL_DISPLAY.get(obj.content_type.app_label, obj.content_type.app_label)


class GrupoSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "permissions", "users_count"]
        read_only_fields = ["id"]

    def get_users_count(self, obj: Group) -> int:
        return obj.user_set.count()


class GrupoWriteSerializer(serializers.ModelSerializer):
    permission_ids = serializers.PrimaryKeyRelatedField(
        source="permissions",
        queryset=Permission.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Group
        fields = ["name", "permission_ids"]

    def create(self, validated_data: dict) -> Group:
        permissions = validated_data.pop("permissions", [])
        group = Group.objects.create(**validated_data)
        group.permissions.set(permissions)
        return group

    def update(self, instance: Group, validated_data: dict) -> Group:
        permissions = validated_data.pop("permissions", None)
        instance.name = validated_data.get("name", instance.name)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance

    def to_representation(self, instance: Group) -> dict:
        return GrupoSerializer(instance, context=self.context).data
