"""
Migración de datos: crea los objetos Categoria a partir del campo legado
categoria_display de cada Producto y enlaza la FK.
"""
from django.db import migrations

CATEGORIAS_SEED = {
    "Logos":         {"icono": "🔤", "orden": 10},
    "Neones":        {"icono": "💡", "orden": 20},
    "Toppers":       {"icono": "🎂", "orden": 30},
    "MDF":           {"icono": "🪵", "orden": 40},
    "Termos":        {"icono": "☕", "orden": 50},
    "Displays":      {"icono": "🖼️", "orden": 60},
    "Grabado Láser": {"icono": "✏️", "orden": 70},
    "Corte Simple":  {"icono": "✂️", "orden": 80},
    "Personalizado": {"icono": "⚙️", "orden": 90},
}


def crear_categorias(apps, schema_editor):
    Categoria = apps.get_model("productos", "Categoria")
    Producto = apps.get_model("productos", "Producto")

    # Crear las categorías predefinidas
    categorias_map = {}
    for nombre, datos in CATEGORIAS_SEED.items():
        cat, _ = Categoria.objects.get_or_create(
            nombre=nombre,
            defaults={"icono": datos["icono"], "orden": datos["orden"], "activo": True},
        )
        categorias_map[nombre] = cat

    # Crear categorías adicionales que puedan existir fuera del seed
    nombres_extra = (
        Producto.objects.exclude(categoria_display__in=categorias_map.keys())
        .exclude(categoria_display="")
        .values_list("categoria_display", flat=True)
        .distinct()
    )
    for nombre in nombres_extra:
        cat, _ = Categoria.objects.get_or_create(
            nombre=nombre,
            defaults={"icono": "📦", "orden": 999, "activo": True},
        )
        categorias_map[nombre] = cat

    # Enlazar cada Producto con su Categoria
    for producto in Producto.objects.exclude(categoria_display=""):
        cat = categorias_map.get(producto.categoria_display)
        if cat:
            producto.categoria = cat
            producto.save(update_fields=["categoria"])


def revertir(apps, schema_editor):
    Categoria = apps.get_model("productos", "Categoria")
    Producto = apps.get_model("productos", "Producto")
    Producto.objects.update(categoria=None)
    Categoria.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("productos", "0003_categoria_and_more"),
    ]

    operations = [
        migrations.RunPython(crear_categorias, reverse_code=revertir),
    ]
