from django.db import migrations


# Formato: (app_label, model_name, codename)
GRUPOS_PERMISOS = {
    "admin": [
        ("users", "user", "view_user"),
        ("users", "user", "add_user"),
        ("users", "user", "change_user"),
        ("users", "user", "delete_user"),
        ("auth", "group", "view_group"),
        ("auth", "group", "add_group"),
        ("auth", "group", "change_group"),
        ("auth", "group", "delete_group"),
        ("audit", "auditlog", "view_auditlog"),
        ("dashboard", "dashboard", "view_dashboard"),
        ("clientes", "cliente", "view_cliente"),
        ("clientes", "cliente", "add_cliente"),
        ("clientes", "cliente", "change_cliente"),
        ("clientes", "cliente", "delete_cliente"),
        ("productos", "producto", "view_producto"),
        ("productos", "producto", "add_producto"),
        ("productos", "producto", "change_producto"),
        ("productos", "producto", "delete_producto"),
        ("productos", "categoria", "view_categoria"),
        ("productos", "categoria", "add_categoria"),
        ("productos", "categoria", "change_categoria"),
        ("productos", "categoria", "delete_categoria"),
        ("ventas", "cotizacion", "view_cotizacion"),
        ("ventas", "cotizacion", "add_cotizacion"),
        ("ventas", "pedido", "view_pedido"),
        ("ventas", "pedido", "change_pedido"),
        ("ventas", "pedido", "delete_pedido"),
        ("ventas", "pedidoitem", "view_pedidoitem"),
        ("ventas", "pedidoitem", "change_pedidoitem"),
    ],
    "empleado": [
        ("clientes", "cliente", "view_cliente"),
        ("clientes", "cliente", "add_cliente"),
        ("clientes", "cliente", "change_cliente"),
        ("ventas", "cotizacion", "view_cotizacion"),
        ("ventas", "cotizacion", "add_cotizacion"),
        ("ventas", "pedido", "view_pedido"),
        ("ventas", "pedido", "change_pedido"),
        ("ventas", "pedidoitem", "view_pedidoitem"),
        ("ventas", "pedidoitem", "change_pedidoitem"),
    ],
}


def seed_grupos(apps, schema_editor):
    from django.contrib.auth.management import create_permissions
    from django.apps import apps as real_apps

    for app_config in real_apps.get_app_configs():
        create_permissions(app_config, apps=apps, verbosity=0)

    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    for nombre_grupo, permisos in GRUPOS_PERMISOS.items():
        grupo, _ = Group.objects.get_or_create(name=nombre_grupo)
        perms_a_asignar = []
        for app_label, model, codename in permisos:
            try:
                ct = ContentType.objects.get(app_label=app_label, model=model)
                perm = Permission.objects.get(content_type=ct, codename=codename)
                perms_a_asignar.append(perm)
            except (ContentType.DoesNotExist, Permission.DoesNotExist):
                pass
        grupo.permissions.set(perms_a_asignar)


def unseed_grupos(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=["admin", "empleado"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
        ("dashboard", "0001_initial"),
        ("clientes", "0001_initial"),
        ("productos", "0001_initial"),
        ("ventas", "0003_alter_pedido_estatus"),
        ("audit", "0001_initial"),
        ("contenttypes", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_grupos, reverse_code=unseed_grupos),
    ]
