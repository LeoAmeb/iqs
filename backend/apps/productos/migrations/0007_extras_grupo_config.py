"""
Migración de datos: añade grupo="extras" a las opciones que deben mostrarse
como píldoras compactas en la sección "Extras" del formulario del cotizador.

Categorías y opciones afectadas
────────────────────────────────
  Logos     → chapetones_dorados, tercera_capa, led, instalacion
  Neones    → chapetones_dorados, apagador, instalacion
  Toppers   → pieza_extra_50, pieza_extra_60
  Displays  → tercera_capa
"""

from django.db import migrations


# IDs de opciones que pasan al grupo "extras" por cada categoría
_EXTRAS: dict[str, list[str]] = {
    "Logos": ["chapetones_dorados", "tercera_capa", "led", "instalacion"],
    "Neones": ["chapetones_dorados", "apagador", "instalacion"],
    "Toppers": ["pieza_extra_50", "pieza_extra_60"],
    "Displays": ["tercera_capa"],
}


def _marcar_extras(apps, schema_editor):
    Categoria = apps.get_model("productos", "Categoria")
    for nombre_cat, ids_extra in _EXTRAS.items():
        try:
            cat = Categoria.objects.get(nombre=nombre_cat)
        except Categoria.DoesNotExist:
            continue
        opciones = cat.config.get("opciones", [])
        ids_set = set(ids_extra)
        modificado = False
        for op in opciones:
            if op.get("id") in ids_set and op.get("grupo") != "extras":
                op["grupo"] = "extras"
                modificado = True
        if modificado:
            cat.config["opciones"] = opciones
            cat.save(update_fields=["config"])


def _revertir_extras(apps, schema_editor):
    Categoria = apps.get_model("productos", "Categoria")
    for nombre_cat, ids_extra in _EXTRAS.items():
        try:
            cat = Categoria.objects.get(nombre=nombre_cat)
        except Categoria.DoesNotExist:
            continue
        opciones = cat.config.get("opciones", [])
        ids_set = set(ids_extra)
        modificado = False
        for op in opciones:
            if op.get("id") in ids_set and op.get("grupo") == "extras":
                op.pop("grupo", None)
                modificado = True
        if modificado:
            cat.config["opciones"] = opciones
            cat.save(update_fields=["config"])


class Migration(migrations.Migration):

    dependencies = [
        ("productos", "0006_seed_config_categorias"),
    ]

    operations = [
        migrations.RunPython(_marcar_extras, reverse_code=_revertir_extras),
    ]
