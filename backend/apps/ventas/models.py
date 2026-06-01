from django.db import models


class FormaPago(models.TextChoices):
    EFECTIVO = "efectivo", "Efectivo"
    TRANSFERENCIA = "transferencia", "Transferencia"
    TARJETA = "tarjeta", "Tarjeta"


class EstatusPedido(models.TextChoices):
    PENDIENTE = "pendiente", "Pendiente"
    PROXIMO = "proximo", "Próximo"
    URGENTE = "urgente", "Urgente"
    EN_PRODUCCION = "en_produccion", "En Producción"
    LISTO = "listo", "Listo"
    ENTREGADO = "entregado", "Entregado"
    CANCELADO = "cancelado", "Cancelado"


class EstatusProduccion(models.TextChoices):
    PENDIENTE = "pendiente", "Pendiente"
    EN_PRODUCCION = "en_produccion", "En Producción"
    LISTO = "listo", "Listo"
    ENTREGADO = "entregado", "Entregado"


class FolioCounter(models.Model):
    ultimo_folio = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Contador de folios"
        verbose_name_plural = "Contador de folios"

    def __str__(self) -> str:
        return f"Último folio: #{self.ultimo_folio:04d}"

    @classmethod
    def siguiente_folio(cls) -> int:
        from django.db import transaction

        with transaction.atomic():
            counter, _ = cls.objects.select_for_update().get_or_create(pk=1)
            counter.ultimo_folio += 1
            counter.save(update_fields=["ultimo_folio"])
            return counter.ultimo_folio


class Cotizacion(models.Model):
    folio = models.IntegerField(unique=True, db_index=True)
    cliente = models.ForeignKey(
        "clientes.Cliente",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cotizaciones",
    )
    nombre_cliente = models.CharField(max_length=255, blank=True, default="")
    telefono = models.CharField(max_length=50, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    fecha_entrega = models.DateField(null=True, blank=True)
    hora_entrega = models.TimeField(null=True, blank=True)
    anticipo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    forma_pago = models.CharField(
        max_length=20, choices=FormaPago.choices, blank=True, default=""
    )
    notas = models.TextField(blank=True, default="")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ganancia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    margen = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    creado_por = models.ForeignKey(
        "users.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="cotizaciones",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Cotización"
        verbose_name_plural = "Cotizaciones"
        indexes = [
            models.Index(fields=["folio"]),
            models.Index(fields=["cliente"]),
            models.Index(fields=["creado_por"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Cotización #{self.folio:04d}"


class Pedido(models.Model):
    folio = models.IntegerField(unique=True, db_index=True)
    cotizacion = models.OneToOneField(
        Cotizacion,
        on_delete=models.PROTECT,
        related_name="pedido",
    )
    cliente = models.ForeignKey(
        "clientes.Cliente",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="pedidos",
    )
    nombre_cliente = models.CharField(max_length=255, blank=True, default="")
    telefono = models.CharField(max_length=50, blank=True, default="")
    fecha_entrega = models.DateField(null=True, blank=True)
    hora_entrega = models.TimeField(null=True, blank=True)
    anticipo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    forma_pago = models.CharField(
        max_length=20, choices=FormaPago.choices, blank=True, default=""
    )
    notas = models.TextField(blank=True, default="")
    estatus = models.CharField(
        max_length=20,
        choices=EstatusPedido.choices,
        default=EstatusPedido.PENDIENTE,
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    creado_por = models.ForeignKey(
        "users.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="pedidos",
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        indexes = [
            models.Index(fields=["folio"]),
            models.Index(fields=["estatus"]),
            models.Index(fields=["fecha_entrega"]),
            models.Index(fields=["deleted_at"]),
            models.Index(fields=["cliente"]),
        ]

    def __str__(self) -> str:
        return f"Pedido #{self.folio:04d}"

    @property
    def is_active(self) -> bool:
        return self.deleted_at is None

    def recalcular_estatus(self) -> None:
        """Deriva el estatus del pedido desde el progreso de sus ítems."""
        if self.estatus in (EstatusPedido.CANCELADO, EstatusPedido.URGENTE):
            return

        statuses = set(self.items.values_list("estatus_produccion", flat=True))
        if not statuses:
            return

        if statuses <= {"entregado"}:
            nuevo = EstatusPedido.ENTREGADO
        elif statuses <= {"listo", "entregado"}:
            nuevo = EstatusPedido.LISTO
        elif "en_produccion" in statuses or "listo" in statuses:
            nuevo = EstatusPedido.EN_PRODUCCION
        else:
            if self.estatus == EstatusPedido.PROXIMO:
                return
            nuevo = EstatusPedido.PENDIENTE

        if self.estatus != nuevo:
            self.estatus = nuevo
            self.save(update_fields=["estatus", "updated_at"])


class CotizacionItem(models.Model):
    cotizacion = models.ForeignKey(
        Cotizacion,
        on_delete=models.CASCADE,
        related_name="items",
    )
    categoria = models.ForeignKey(
        "productos.Categoria",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cotizacion_items",
    )
    nombre_producto = models.CharField(max_length=200, blank=True, default="")
    tipo_calculo = models.CharField(max_length=30, blank=True, default="")
    descripcion = models.CharField(max_length=500, blank=True, default="")
    cantidad = models.IntegerField(default=1)
    precio_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    iva_pct = models.DecimalField(max_digits=5, decimal_places=2, default=16)
    iva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ganancia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    margen = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    detalles = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Ítem de cotización"
        verbose_name_plural = "Ítems de cotización"
        indexes = [
            models.Index(fields=["cotizacion"]),
        ]

    def __str__(self) -> str:
        return f"{self.nombre_producto} — Cotización #{self.cotizacion.folio:04d}"


class PedidoItem(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="items",
    )
    producto = models.ForeignKey(
        "productos.Producto",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="pedido_items",
    )
    nombre_producto = models.CharField(max_length=200, blank=True, default="")
    tipo_calculo = models.CharField(max_length=30, blank=True, default="")
    descripcion = models.CharField(max_length=500, blank=True, default="")
    cantidad = models.IntegerField(default=1)
    precio_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    detalles = models.JSONField(default=dict, blank=True)
    estatus_produccion = models.CharField(
        max_length=20,
        choices=EstatusProduccion.choices,
        default=EstatusProduccion.PENDIENTE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Ítem de pedido"
        verbose_name_plural = "Ítems de pedido"
        indexes = [
            models.Index(fields=["pedido"]),
            models.Index(fields=["estatus_produccion"]),
        ]

    def __str__(self) -> str:
        return f"{self.nombre_producto} — Pedido #{self.pedido.folio:04d}"


class PedidoItemLog(models.Model):
    item = models.ForeignKey(
        PedidoItem,
        on_delete=models.CASCADE,
        related_name="logs",
    )
    usuario = models.ForeignKey(
        "users.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="pedido_item_logs",
    )
    estatus_anterior = models.CharField(max_length=20)
    estatus_nuevo = models.CharField(max_length=20)
    nota = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Log de ítem de pedido"
        verbose_name_plural = "Logs de ítems de pedido"
        indexes = [
            models.Index(fields=["item"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"#{self.item_id}: {self.estatus_anterior} → {self.estatus_nuevo}"
