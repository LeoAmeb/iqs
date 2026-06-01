from rest_framework import serializers

from apps.productos.models import Categoria, ConfiguracionSistema, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre", "icono", "orden", "activo", "tipo_calculo", "config", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CategoriaWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["nombre", "icono", "orden", "activo", "tipo_calculo", "config"]

    def to_representation(self, instance: Categoria):
        return CategoriaSerializer(instance).data


class ProductoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id",
            "nombre",
            "tipo_calculo",
            "categoria",
            "icono",
            "config",
            "activo",
            "orden",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProductoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ["nombre", "tipo_calculo", "categoria", "icono", "config", "activo", "orden"]

    def to_representation(self, instance: Producto):
        return ProductoSerializer(instance).data


class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionSistema
        fields = ["hora_objetivo", "hora_laser", "meta_mensual"]
