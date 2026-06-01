from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.users.models import User


class GrupoMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)


class UserSerializer(serializers.ModelSerializer):
    groups = GrupoMinimalSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "groups",
            "is_active",
            "is_superuser",
            "avatar",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_superuser", "created_at", "updated_at"]


class UserMeSerializer(serializers.ModelSerializer):
    """
    Representación del usuario autenticado.
    Incluye los permisos derivados de sus grupos en formato 'app_label.codename'.
    """

    groups = GrupoMinimalSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "groups",
            "is_active",
            "is_superuser",
            "avatar",
            "permissions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_superuser", "created_at", "updated_at"]

    def get_permissions(self, obj: User) -> list[str]:
        if obj.is_superuser:
            return ["*"]
        return sorted(obj.get_all_permissions())


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        validators=[validate_password],
    )
    group_ids = serializers.PrimaryKeyRelatedField(
        source="groups",
        queryset=Group.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "group_ids",
            "is_active",
        ]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data: dict) -> User:
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if groups:
            user.groups.set(groups)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende el payload JWT con datos del usuario para evitar
    una llamada adicional a /auth/user/ después del login.
    """

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        token["is_superuser"] = user.is_superuser
        token["groups"] = list(user.groups.values_list("name", flat=True))
        if user.is_superuser:
            token["permissions"] = ["*"]
        else:
            token["permissions"] = sorted(user.get_all_permissions())
        return token


class UserUpdateSerializer(serializers.ModelSerializer):
    group_ids = serializers.PrimaryKeyRelatedField(
        source="groups",
        queryset=Group.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "group_ids",
            "is_active",
            "avatar",
        ]

    def update(self, instance: User, validated_data: dict) -> User:
        groups = validated_data.pop("groups", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        return instance
