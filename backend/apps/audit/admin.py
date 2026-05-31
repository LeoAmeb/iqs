from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "resource_type", "resource_id", "user", "ip_address", "created_at"]
    list_filter = ["action", "resource_type"]
    search_fields = ["resource_type", "resource_id", "user__email"]
    readonly_fields = [
        "user",
        "action",
        "resource_type",
        "resource_id",
        "ip_address",
        "user_agent",
        "extra_data",
        "created_at",
    ]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return request.user.is_superuser
