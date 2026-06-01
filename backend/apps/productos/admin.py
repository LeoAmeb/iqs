from django.contrib import admin

from apps.productos.models import Categoria, ConfiguracionSistema, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "icono", "orden", "activo"]
    list_filter = ["activo"]
    search_fields = ["nombre"]
    ordering = ["orden", "nombre"]


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "tipo_calculo", "categoria", "activo", "orden"]
    list_filter = ["tipo_calculo", "activo", "categoria"]
    search_fields = ["nombre"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["orden", "nombre"]


@admin.register(ConfiguracionSistema)
class ConfiguracionSistemaAdmin(admin.ModelAdmin):
    list_display = ["hora_objetivo", "hora_laser", "meta_mensual"]

    def has_add_permission(self, request) -> bool:
        return not ConfiguracionSistema.objects.exists()

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
