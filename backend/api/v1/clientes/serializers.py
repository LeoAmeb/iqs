from rest_framework import serializers

from apps.clientes.models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ["id", "nombre", "telefono", "email", "notas", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClienteWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ["nombre", "telefono", "email", "notas"]
