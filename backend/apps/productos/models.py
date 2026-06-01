from django.db import models


class TipoCalculo(models.TextChoices):
    PRECIO_FIJO = "precio_fijo", "Precio fijo + opciones"
    POR_DIMENSION = "por_dimension", "Por dimensión"
    TABLA_TIERED = "tabla_tiered", "Tabla de precios por niveles"
    POR_HORA = "por_hora", "Por horas de trabajo"
    MANUAL = "manual", "Entrada manual"


class ConfiguracionSistema(models.Model):
    hora_objetivo = models.DecimalField(max_digits=8, decimal_places=2, default=230)
    hora_laser = models.DecimalField(max_digits=8, decimal_places=2, default=30)
    meta_mensual = models.DecimalField(max_digits=10, decimal_places=2, default=20000)

    class Meta:
        verbose_name = "Configuración del sistema"
        verbose_name_plural = "Configuración del sistema"

    def __str__(self) -> str:
        return "Configuración del sistema"

    @classmethod
    def get(cls) -> "ConfiguracionSistema":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    icono = models.CharField(max_length=10, default="📦")
    orden = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)
    tipo_calculo = models.CharField(
        max_length=30, choices=TipoCalculo.choices, default=TipoCalculo.PRECIO_FIJO
    )
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["orden", "nombre"]
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        indexes = [
            models.Index(fields=["activo"]),
        ]

    def __str__(self) -> str:
        return self.nombre


class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    tipo_calculo = models.CharField(max_length=30, choices=TipoCalculo.choices)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="productos",
    )
    # Campo legado — preservado para la migración de datos; no exponer en API
    categoria_display = models.CharField(max_length=100, blank=True)
    icono = models.CharField(max_length=10, default="📦")
    config = models.JSONField(default=dict, blank=True)
    activo = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["orden", "nombre"]
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        indexes = [
            models.Index(fields=["activo"]),
            models.Index(fields=["tipo_calculo"]),
            models.Index(fields=["categoria"]),
        ]

    def __str__(self) -> str:
        return self.nombre
