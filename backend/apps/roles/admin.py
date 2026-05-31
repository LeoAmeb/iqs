from django.contrib import admin

from apps.roles.models import Permission, Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "users_count", "created_at"]
    search_fields = ["name", "slug"]
    filter_horizontal = ["permissions"]
    readonly_fields = ["slug", "created_at", "updated_at"]
    prepopulated_fields = {}  # slug is auto-set in model.save()

    def users_count(self, obj: Role) -> int:
        return obj.users.count()

    users_count.short_description = "Users"


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ["codename", "name", "category"]
    list_filter = ["category"]
    search_fields = ["codename", "name", "category"]
    ordering = ["category", "codename"]
