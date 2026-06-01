from django.db import transaction
from rest_framework import serializers

from apps.clientes.models import Cliente
from apps.productos.models import Categoria
from apps.ventas.models import (
    Cotizacion,
    CotizacionItem,
    FolioCounter,
    Pedido,
    PedidoItem,
    PedidoItemLog,
)


class CotizacionItemCreateSerializer(serializers.Serializer):
    """Ítems de cotización enviados desde el frontend (totales ya calculados)."""

    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        required=False,
        allow_null=True,
    )
    nombre_producto = serializers.CharField(max_length=200)
    tipo_calculo = serializers.CharField(max_length=30)
    descripcion = serializers.CharField(max_length=500, allow_blank=True, default="")
    cantidad = serializers.IntegerField(min_value=1, default=1)
    precio_unit = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    iva_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=16)
    iva = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    ganancia = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    margen = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    detalles = serializers.JSONField(default=dict)


class CotizacionCreateSerializer(serializers.Serializer):
    """
    Crea Cotizacion + CotizacionItems.
    Si no se pasa cliente_id, busca por teléfono o nombre; crea uno nuevo si no existe.
    Para convertir en Pedido usar el action `proceder`.
    """

    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        required=False,
        allow_null=True,
    )
    nombre_cliente = serializers.CharField(max_length=255, allow_blank=True, default="")
    telefono = serializers.CharField(max_length=50, allow_blank=True, default="")
    email = serializers.EmailField(allow_blank=True, default="")

    fecha_entrega = serializers.DateField(required=False, allow_null=True)
    hora_entrega = serializers.TimeField(required=False, allow_null=True)
    anticipo = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    forma_pago = serializers.CharField(max_length=20, allow_blank=True, default="")
    notas = serializers.CharField(allow_blank=True, default="")

    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    costo = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    ganancia = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    margen = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)

    items = CotizacionItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La cotización debe tener al menos un ítem.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        usuario = self.context["request"].user
        items_data = validated_data.pop("items")
        cliente = validated_data.pop("cliente_id", None)

        # Buscar o crear cliente a partir de los datos capturados
        if cliente is None:
            nombre = validated_data.get("nombre_cliente", "")
            telefono = validated_data.get("telefono", "")
            if nombre or telefono:
                if telefono:
                    cliente = Cliente.objects.filter(telefono=telefono).first()
                if cliente is None and nombre:
                    cliente = Cliente.objects.filter(nombre__iexact=nombre).first()
                if cliente is None:
                    cliente = Cliente.objects.create(
                        nombre=nombre,
                        telefono=telefono or "",
                        email=validated_data.get("email", ""),
                    )

        folio = FolioCounter.siguiente_folio()

        cotizacion = Cotizacion.objects.create(
            folio=folio,
            cliente=cliente,
            nombre_cliente=validated_data.get("nombre_cliente", ""),
            telefono=validated_data.get("telefono", ""),
            email=validated_data.get("email", ""),
            fecha_entrega=validated_data.get("fecha_entrega"),
            hora_entrega=validated_data.get("hora_entrega"),
            anticipo=validated_data.get("anticipo", 0),
            forma_pago=validated_data.get("forma_pago", ""),
            notas=validated_data.get("notas", ""),
            total=validated_data["total"],
            costo=validated_data.get("costo", 0),
            iva=validated_data.get("iva", 0),
            ganancia=validated_data.get("ganancia", 0),
            margen=validated_data.get("margen", 0),
            creado_por=usuario,
        )

        for item_data in items_data:
            categoria = item_data.pop("categoria_id", None)
            CotizacionItem.objects.create(
                cotizacion=cotizacion,
                categoria=categoria,
                nombre_producto=item_data.get("nombre_producto", ""),
                tipo_calculo=item_data.get("tipo_calculo", ""),
                descripcion=item_data.get("descripcion", ""),
                cantidad=item_data.get("cantidad", 1),
                precio_unit=item_data.get("precio_unit", 0),
                total=item_data.get("total", 0),
                iva_pct=item_data.get("iva_pct", 16),
                iva=item_data.get("iva", 0),
                costo=item_data.get("costo", 0),
                ganancia=item_data.get("ganancia", 0),
                margen=item_data.get("margen", 0),
                detalles=item_data.get("detalles", {}),
            )

        return cotizacion


class CotizacionItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CotizacionItem
        fields = [
            "nombre_producto",
            "descripcion",
            "cantidad",
            "precio_unit",
            "total",
            "iva_pct",
            "iva",
            "costo",
            "ganancia",
            "margen",
            "detalles",
        ]

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        self._recalcular_totales_cotizacion(instance.cotizacion)
        return instance

    @staticmethod
    def _recalcular_totales_cotizacion(cotizacion):
        from decimal import Decimal
        from django.db.models import Sum

        agg = cotizacion.items.aggregate(
            total=Sum("total"),
            costo=Sum("costo"),
            iva=Sum("iva"),
            ganancia=Sum("ganancia"),
        )
        total = agg["total"] or Decimal("0")
        ganancia = agg["ganancia"] or Decimal("0")
        margen = round(ganancia / total * 100, 2) if total else Decimal("0")
        cotizacion.total = total
        cotizacion.costo = agg["costo"] or Decimal("0")
        cotizacion.iva = agg["iva"] or Decimal("0")
        cotizacion.ganancia = ganancia
        cotizacion.margen = margen
        cotizacion.save(update_fields=["total", "costo", "iva", "ganancia", "margen", "updated_at"])


class PedidoItemLogSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.full_name", read_only=True, default="")

    class Meta:
        model = PedidoItemLog
        fields = ["id", "estatus_anterior", "estatus_nuevo", "nota", "usuario_nombre", "created_at"]


class PedidoItemSerializer(serializers.ModelSerializer):
    logs = PedidoItemLogSerializer(many=True, read_only=True)

    class Meta:
        model = PedidoItem
        fields = [
            "id",
            "producto",
            "nombre_producto",
            "tipo_calculo",
            "descripcion",
            "cantidad",
            "precio_unit",
            "total",
            "costo",
            "detalles",
            "estatus_produccion",
            "logs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PedidoSerializer(serializers.ModelSerializer):
    items = PedidoItemSerializer(many=True, read_only=True)
    creado_por_nombre = serializers.CharField(source="creado_por.full_name", read_only=True, default="")

    class Meta:
        model = Pedido
        fields = [
            "id",
            "folio",
            "cotizacion",
            "cliente",
            "nombre_cliente",
            "telefono",
            "fecha_entrega",
            "hora_entrega",
            "anticipo",
            "forma_pago",
            "notas",
            "estatus",
            "total",
            "costo",
            "creado_por",
            "creado_por_nombre",
            "deleted_at",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "folio", "cotizacion", "creado_por", "deleted_at", "created_at", "updated_at"]


class PedidoListSerializer(serializers.ModelSerializer):
    """Versión ligera para el listado (sin items ni logs)."""

    creado_por_nombre = serializers.CharField(source="creado_por.full_name", read_only=True, default="")

    class Meta:
        model = Pedido
        fields = [
            "id",
            "folio",
            "cliente",
            "nombre_cliente",
            "telefono",
            "fecha_entrega",
            "hora_entrega",
            "anticipo",
            "forma_pago",
            "estatus",
            "total",
            "costo",
            "creado_por_nombre",
            "deleted_at",
            "created_at",
            "updated_at",
        ]


class PedidoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = [
            "nombre_cliente",
            "telefono",
            "fecha_entrega",
            "hora_entrega",
            "anticipo",
            "forma_pago",
            "notas",
            "estatus",
        ]


class CotizacionListSerializer(serializers.ModelSerializer):
    """Versión ligera para el listado (sin ítems completos)."""

    creado_por_nombre = serializers.CharField(source="creado_por.full_name", read_only=True, default="")
    pedido_id = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Cotizacion
        fields = [
            "id",
            "folio",
            "cliente",
            "nombre_cliente",
            "telefono",
            "fecha_entrega",
            "anticipo",
            "forma_pago",
            "total",
            "costo",
            "iva",
            "ganancia",
            "margen",
            "creado_por_nombre",
            "pedido_id",
            "items_count",
            "created_at",
        ]

    def get_pedido_id(self, obj):
        try:
            return obj.pedido.id
        except Exception:
            return None

    def get_items_count(self, obj):
        return obj.items.count()


class CotizacionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CotizacionItem
        fields = [
            "id",
            "categoria",
            "nombre_producto",
            "tipo_calculo",
            "descripcion",
            "cantidad",
            "precio_unit",
            "total",
            "iva_pct",
            "iva",
            "costo",
            "ganancia",
            "margen",
            "detalles",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CotizacionSerializer(serializers.ModelSerializer):
    items = CotizacionItemSerializer(many=True, read_only=True)
    creado_por_nombre = serializers.CharField(source="creado_por.full_name", read_only=True, default="")
    pedido_id = serializers.SerializerMethodField()

    class Meta:
        model = Cotizacion
        fields = [
            "id",
            "folio",
            "cliente",
            "nombre_cliente",
            "telefono",
            "email",
            "fecha_entrega",
            "hora_entrega",
            "anticipo",
            "forma_pago",
            "notas",
            "total",
            "costo",
            "iva",
            "ganancia",
            "margen",
            "creado_por",
            "creado_por_nombre",
            "pedido_id",
            "items",
            "created_at",
            "updated_at",
        ]

    def get_pedido_id(self, obj):
        try:
            return obj.pedido.id
        except Exception:
            return None


class ProduccionItemSerializer(serializers.ModelSerializer):
    """Serializer para el Kanban de producción."""

    folio_pedido = serializers.IntegerField(source="pedido.folio", read_only=True)
    nombre_cliente = serializers.CharField(source="pedido.nombre_cliente", read_only=True)
    fecha_entrega = serializers.DateField(source="pedido.fecha_entrega", read_only=True)

    class Meta:
        model = PedidoItem
        fields = [
            "id",
            "folio_pedido",
            "nombre_cliente",
            "fecha_entrega",
            "nombre_producto",
            "tipo_calculo",
            "descripcion",
            "cantidad",
            "precio_unit",
            "total",
            "estatus_produccion",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "folio_pedido", "nombre_cliente", "fecha_entrega", "created_at", "updated_at"]


class ProduccionItemUpdateSerializer(serializers.ModelSerializer):
    nota = serializers.CharField(allow_blank=True, default="", write_only=True, required=False)

    class Meta:
        model = PedidoItem
        fields = ["estatus_produccion", "nota"]

    def update(self, instance, validated_data):
        nota = validated_data.pop("nota", "")
        estatus_anterior = instance.estatus_produccion
        instance = super().update(instance, validated_data)

        if instance.estatus_produccion != estatus_anterior:
            request = self.context.get("request")
            PedidoItemLog.objects.create(
                item=instance,
                usuario=request.user if request else None,
                estatus_anterior=estatus_anterior,
                estatus_nuevo=instance.estatus_produccion,
                nota=nota,
            )
            instance.pedido.recalcular_estatus()

        return instance
