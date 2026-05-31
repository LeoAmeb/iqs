from django.apps import apps as django_apps
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.users.models import User


def _role_queryset():
    Role = django_apps.get_model("roles", "Role")
    return Role.objects.all()


class RoleMinimalSerializer(serializers.Serializer):
    """Minimal role representation used when nesting inside UserSerializer."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)


class UserSerializer(serializers.ModelSerializer):
    """Full user representation for admin views."""

    role = RoleMinimalSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "is_superuser",
            "avatar",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_superuser", "created_at", "updated_at"]


class UserMeSerializer(serializers.ModelSerializer):
    """
    Representation of the currently authenticated user.
    Includes the list of permission codenames derived from the user's role.
    """

    role = RoleMinimalSerializer(read_only=True)
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
            "role",
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
        if obj.role is None:
            return []
        return list(obj.role.permissions.values_list("codename", flat=True))


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user (admin endpoint)."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
        validators=[validate_password],
    )
    role_id = serializers.PrimaryKeyRelatedField(
        source="role",
        queryset=_role_queryset(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "role_id",
            "is_active",
        ]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT payload with user-specific claims so the frontend
    does not need a separate /auth/user/ call after login.
    """

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        token["is_superuser"] = user.is_superuser
        token["role"] = user.role.slug if user.role else None
        if user.is_superuser:
            token["permissions"] = ["*"]
        elif user.role:
            token["permissions"] = list(
                user.role.permissions.values_list("codename", flat=True)
            )
        else:
            token["permissions"] = []
        return token


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a user (no password change here)."""

    role_id = serializers.PrimaryKeyRelatedField(
        source="role",
        queryset=_role_queryset(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "role_id",
            "is_active",
            "avatar",
        ]
