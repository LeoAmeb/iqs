from django.contrib import admin

from apps.ventas.models import Cotizacion, FolioCounter, Pedido, PedidoItem, PedidoItemLog


@admin.register(FolioCounter)
class FolioCounterAdmin(admin.ModelAdmin):
    list_display = ["ultimo_folio"]

    def has_add_permission(self, request) -> bool:
        return not FolioCounter.objects.exists()

    def has_delete_permission(self, request, obj=None) -> bool:
        return False


@admin.register(Cotizacion)
class CotizacionAdmin(admin.ModelAdmin):
    list_display = ["folio", "nombre_cliente", "total", "creado_por", "created_at"]
    search_fields = ["folio", "nombre_cliente", "telefono"]
    list_filter = ["forma_pago", "created_at"]
    readonly_fields = ["folio", "creado_por", "created_at", "updated_at"]


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["folio", "nombre_cliente", "estatus", "total", "fecha_entrega", "deleted_at"]
    search_fields = ["folio", "nombre_cliente", "telefono"]
    list_filter = ["estatus", "forma_pago"]
    readonly_fields = ["folio", "cotizacion", "creado_por", "created_at", "updated_at"]


@admin.register(PedidoItem)
class PedidoItemAdmin(admin.ModelAdmin):
    list_display = ["nombre_producto", "pedido", "cantidad", "total", "estatus_produccion"]
    list_filter = ["estatus_produccion", "tipo_calculo"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(PedidoItemLog)
class PedidoItemLogAdmin(admin.ModelAdmin):
    list_display = ["item", "estatus_anterior", "estatus_nuevo", "usuario", "created_at"]
    readonly_fields = ["item", "usuario", "estatus_anterior", "estatus_nuevo", "nota", "created_at"]

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
