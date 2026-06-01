from django.contrib import admin

from apps.clientes.models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ["nombre", "telefono", "email", "created_at"]
    search_fields = ["nombre", "telefono", "email"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["nombre"]
