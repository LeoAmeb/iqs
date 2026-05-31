from django.db import migrations

PERMISSIONS = [
    # Dashboard
    {"codename": "dashboard.view", "name": "Ver dashboard", "category": "Dashboard"},
    # Users
    {"codename": "users.view", "name": "Ver usuarios", "category": "Usuarios"},
    {"codename": "users.create", "name": "Crear usuarios", "category": "Usuarios"},
    {"codename": "users.edit", "name": "Editar usuarios", "category": "Usuarios"},
    {"codename": "users.delete", "name": "Eliminar usuarios", "category": "Usuarios"},
    # Roles
    {"codename": "roles.view", "name": "Ver roles", "category": "Roles"},
    {"codename": "roles.create", "name": "Crear roles", "category": "Roles"},
    {"codename": "roles.edit", "name": "Editar roles", "category": "Roles"},
    {"codename": "roles.delete", "name": "Eliminar roles", "category": "Roles"},
    # Audit
    {"codename": "audit.view", "name": "Ver auditoría", "category": "Auditoría"},
]


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("roles", "Permission")
    for perm in PERMISSIONS:
        Permission.objects.get_or_create(codename=perm["codename"], defaults=perm)


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("roles", "Permission")
    codenames = [p["codename"] for p in PERMISSIONS]
    Permission.objects.filter(codename__in=codenames).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("roles", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_code=unseed_permissions),
    ]
