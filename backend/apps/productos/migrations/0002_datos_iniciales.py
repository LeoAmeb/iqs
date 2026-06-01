# Migración de datos: carga el catálogo inicial de productos y la configuración del sistema.
# Las fórmulas de precio están documentadas en los RF (sección 2.5).
from django.db import migrations


# ─── Helpers de urgencia ──────────────────────────────────────────────────────

def _urg_std():
    return {"urgente": {"pct": 0.20}, "mismodia": {"pct": 0.50}}


def _urg_solo_urgente(pct=0.20):
    return {"urgente": {"pct": pct}}


# ─── Opciones reutilizables ───────────────────────────────────────────────────

_INSTALACION = {
    "id": "instalacion", "label": "Instalación",
    "tipo": "checkbox", "precio_delta": 300, "costo_delta": 0, "multiplicado": False,
}

_LOGO_OPCIONES = [
    {"id": "dorado",       "label": "Chapetón dorado", "tipo": "checkbox", "precio_delta": 100, "costo_delta": 0,   "multiplicado": True},
    {"id": "tercera_capa", "label": "Tercera capa",    "tipo": "checkbox", "precio_delta": 350, "costo_delta": 0,   "multiplicado": True},
    {"id": "led",          "label": "LED",              "tipo": "checkbox", "precio_delta": 0,   "costo_delta": 105, "multiplicado": True},
    _INSTALACION,
]

_NEON_OPCIONES = [
    {
        "id": "complejidad", "label": "Complejidad", "tipo": "select", "default": "simple",
        "multiplicado": True,
        "valores": [
            {"id": "simple", "label": "Simple",  "precio_delta": 0},
            {"id": "media",  "label": "Media",   "precio_delta": 400},
            {"id": "alta",   "label": "Alta",    "precio_delta": 600},
        ],
    },
    {
        "id": "metraje", "label": "Metraje", "tipo": "select", "default": "normal",
        "multiplicado": True,
        # El frontend calcula costo = (metros × costo_por_metro + costo_base_fijo) × cantidad
        "costo_por_metro": 32, "costo_base_fijo": 223,
        "valores": [
            {"id": "normal", "label": "Normal (4m)",  "precio_delta": 0,   "metros": 4},
            {"id": "medio",  "label": "Medio (7m)",   "precio_delta": 250, "metros": 7},
            {"id": "largo",  "label": "Largo (10m)",  "precio_delta": 350, "metros": 10},
        ],
    },
    {"id": "dorado",    "label": "Chapetón dorado", "tipo": "checkbox", "precio_delta": 100, "costo_delta": 0, "multiplicado": True},
    {"id": "apagador",  "label": "Apagador",         "tipo": "checkbox", "precio_delta": 120, "costo_delta": 0, "multiplicado": False},
    _INSTALACION,
]

_TOPPER_OPCIONES = [
    {
        "id": "extra", "label": "Extra", "tipo": "select", "default": "sin_extra",
        "multiplicado": True,
        "valores": [
            {"id": "sin_extra", "label": "Sin extra", "precio_delta": 0},
            {"id": "extra_50",  "label": "+$50",       "precio_delta": 50},
            {"id": "extra_60",  "label": "+$60",       "precio_delta": 60},
        ],
    }
]

_DISPLAY_OPCIONES = [
    {"id": "tercera_capa", "label": "Tercera capa", "tipo": "checkbox", "precio_delta": 150, "costo_delta": 0, "multiplicado": True},
]

_MDF_NOMBRE_OPCIONES = [
    {"id": "pintado", "label": "Acabado pintado", "tipo": "checkbox", "precio_delta": 100, "costo_delta": 33, "multiplicado": True},
    # tipo "number": precio/costo por unidad (metros de vinil)
    {"id": "vinil", "label": "Metros de vinil", "tipo": "number", "precio_por_unidad": 120, "costo_por_unidad": 60, "multiplicado": True, "default": 0, "min": 0},
]


# ─── Catálogo de productos ────────────────────────────────────────────────────

PRODUCTOS = [

    # ══════════════════════════════════════════════════════════════════════════
    # LOGOS CON BASE — tipo "precio_fijo"
    # costo_base = tamCm² × 0.04 × 2 (sin LED)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Logo con base 50 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Logos", "icono": "🔤", "orden": 10,
        "config": {
            "precio_base": 1590, "costo_base": 200,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _LOGO_OPCIONES,
        },
    },
    {
        "nombre": "Logo con base 60 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Logos", "icono": "🔤", "orden": 11,
        "config": {
            "precio_base": 2090, "costo_base": 288,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _LOGO_OPCIONES,
        },
    },
    {
        "nombre": "Logo con base 80 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Logos", "icono": "🔤", "orden": 12,
        "config": {
            "precio_base": 3490, "costo_base": 512,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _LOGO_OPCIONES,
        },
    },
    {
        "nombre": "Logo con base 90 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Logos", "icono": "🔤", "orden": 13,
        "config": {
            "precio_base": 3990, "costo_base": 648,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _LOGO_OPCIONES,
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # LOGOS SIN BASE — tipo "por_dimension"
    # precio = (factor_a + factor_b) × area × multiplicador_precio
    # costo  = (factor_a + factor_b) × area × cantidad + costo_extra_por_pieza × cantidad
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Logo sin base — espejo sobre MDF",
        "tipo_calculo": "por_dimension",
        "categoria_display": "Logos", "icono": "🔤", "orden": 14,
        "config": {
            "factor_a": 0.06,    # costo espejo por cm²
            "factor_b": 0.006,   # costo MDF por cm²
            "multiplicador_precio": 5,
            "costo_extra_por_pieza": 26,
            "ancho_default": 30, "alto_default": 30,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": [_INSTALACION],
        },
    },
    {
        "nombre": "Logo sin base premium — espejo sobre transparente",
        "tipo_calculo": "por_dimension",
        "categoria_display": "Logos", "icono": "🔤", "orden": 15,
        "config": {
            "factor_a": 0.06,    # costo espejo
            "factor_b": 0.04,    # costo acrílico transparente
            "multiplicador_precio": 5,
            "costo_extra_por_pieza": 26,
            "ancho_default": 30, "alto_default": 30,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": [_INSTALACION],
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # NEONES — tipo "precio_fijo"
    # costo base = metros_default × 32 + 223 (metraje normal 4m)
    # El costo cambia según opción "metraje" (ver costo_por_metro + costo_base_fijo)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Neón pequeño",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Neones", "icono": "💡", "orden": 20,
        "config": {
            "precio_base": 1050, "costo_base": 351,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _NEON_OPCIONES,
        },
    },
    {
        "nombre": "Neón mediano",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Neones", "icono": "💡", "orden": 21,
        "config": {
            "precio_base": 1700, "costo_base": 351,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _NEON_OPCIONES,
        },
    },
    {
        "nombre": "Neón grande",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Neones", "icono": "💡", "orden": 22,
        "config": {
            "precio_base": 2800, "costo_base": 351,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _NEON_OPCIONES,
        },
    },
    {
        "nombre": "Neón extra grande",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Neones", "icono": "💡", "orden": 23,
        "config": {
            "precio_base": 3900, "costo_base": 351,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _NEON_OPCIONES,
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # TOPPERS — tipo "precio_fijo"
    # Solo urgente +20% (no mismo día)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Topper 15 cm — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Toppers", "icono": "🎂", "orden": 30,
        "config": {
            "precio_base": 150, "costo_base": 18,
            "urgencia": _urg_solo_urgente(), "permite_mismodia": False,
            "opciones": _TOPPER_OPCIONES,
        },
    },
    {
        "nombre": "Topper 12 cm — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Toppers", "icono": "🎂", "orden": 31,
        "config": {
            "precio_base": 120, "costo_base": 12,
            "urgencia": _urg_solo_urgente(), "permite_mismodia": False,
            "opciones": _TOPPER_OPCIONES,
        },
    },
    {
        "nombre": "Topper 15 cm — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Toppers", "icono": "🎂", "orden": 32,
        "config": {
            "precio_base": 100, "costo_base": 18,
            "urgencia": _urg_solo_urgente(), "permite_mismodia": False,
            "opciones": _TOPPER_OPCIONES,
        },
    },
    {
        "nombre": "Topper 12 cm — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Toppers", "icono": "🎂", "orden": 33,
        "config": {
            "precio_base": 85, "costo_base": 12,
            "urgencia": _urg_solo_urgente(), "permite_mismodia": False,
            "opciones": _TOPPER_OPCIONES,
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # MDF NOMBRES / LETRAS — tipo "precio_fijo"
    # costo_base = tamCm² × 0.006
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "MDF nombres/letras 60 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "MDF", "icono": "🪵", "orden": 40,
        "config": {
            "precio_base": 150, "costo_base": 21.6,  # 60² × 0.006
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _MDF_NOMBRE_OPCIONES,
        },
    },
    {
        "nombre": "MDF nombres/letras 80 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "MDF", "icono": "🪵", "orden": 41,
        "config": {
            "precio_base": 260, "costo_base": 38.4,  # 80² × 0.006
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": _MDF_NOMBRE_OPCIONES,
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # MDF BASES — tipo "tabla_tiered"
    # Regla mayoreo: si total piezas en carrito ≥ umbral_mayoreo → precio_mayoreo
    # costo = cm2 × factor_costo_cm2 × cantidad
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "MDF Bases",
        "tipo_calculo": "tabla_tiered",
        "categoria_display": "MDF", "icono": "🪵", "orden": 42,
        "config": {
            "umbral_mayoreo": 20,
            "dimensiones": ["material", "medida"],
            "filas": [
                # 3 mm
                {"material": "3mm", "medida": "12x12", "precio_menudeo": 16, "precio_mayoreo": 10, "factor_costo_cm2": 0.006, "cm2": 144},
                {"material": "3mm", "medida": "16x16", "precio_menudeo": 18, "precio_mayoreo": 12, "factor_costo_cm2": 0.006, "cm2": 256},
                {"material": "3mm", "medida": "22x22", "precio_menudeo": 24, "precio_mayoreo": 16, "factor_costo_cm2": 0.006, "cm2": 484},
                {"material": "3mm", "medida": "25x25", "precio_menudeo": 28, "precio_mayoreo": 18, "factor_costo_cm2": 0.006, "cm2": 625},
                {"material": "3mm", "medida": "28x28", "precio_menudeo": 34, "precio_mayoreo": 22, "factor_costo_cm2": 0.006, "cm2": 784},
                {"material": "3mm", "medida": "30x30", "precio_menudeo": 38, "precio_mayoreo": 25, "factor_costo_cm2": 0.006, "cm2": 900},
                # 6 mm
                {"material": "6mm", "medida": "12x12", "precio_menudeo": 28, "precio_mayoreo": 18, "factor_costo_cm2": 0.0084, "cm2": 144},
                {"material": "6mm", "medida": "16x16", "precio_menudeo": 34, "precio_mayoreo": 22, "factor_costo_cm2": 0.0084, "cm2": 256},
                {"material": "6mm", "medida": "22x22", "precio_menudeo": 42, "precio_mayoreo": 28, "factor_costo_cm2": 0.0084, "cm2": 484},
                {"material": "6mm", "medida": "25x25", "precio_menudeo": 48, "precio_mayoreo": 32, "factor_costo_cm2": 0.0084, "cm2": 625},
                {"material": "6mm", "medida": "28x28", "precio_menudeo": 60, "precio_mayoreo": 40, "factor_costo_cm2": 0.0084, "cm2": 784},
                {"material": "6mm", "medida": "30x30", "precio_menudeo": 66, "precio_mayoreo": 44, "factor_costo_cm2": 0.0084, "cm2": 900},
                # 6 mm blanco
                {"material": "6blanco", "medida": "12x12", "precio_menudeo": 30, "precio_mayoreo": 20, "factor_costo_cm2": 0.0094, "cm2": 144},
                {"material": "6blanco", "medida": "16x16", "precio_menudeo": 36, "precio_mayoreo": 24, "factor_costo_cm2": 0.0094, "cm2": 256},
                {"material": "6blanco", "medida": "22x22", "precio_menudeo": 48, "precio_mayoreo": 32, "factor_costo_cm2": 0.0094, "cm2": 484},
                {"material": "6blanco", "medida": "25x25", "precio_menudeo": 54, "precio_mayoreo": 36, "factor_costo_cm2": 0.0094, "cm2": 625},
                {"material": "6blanco", "medida": "28x28", "precio_menudeo": 66, "precio_mayoreo": 44, "factor_costo_cm2": 0.0094, "cm2": 784},
                {"material": "6blanco", "medida": "30x30", "precio_menudeo": 76, "precio_mayoreo": 50, "factor_costo_cm2": 0.0094, "cm2": 900},
            ],
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # MDF LLAVEROS — tipo "precio_fijo"
    # costo = 25cm² × 0.006 + $1 = $1.15/pieza
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "MDF Llaveros",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "MDF", "icono": "🪵", "orden": 43,
        "config": {
            "precio_base": 15, "costo_base": 1.15,
            "cantidad_default": 20,
            "urgencia": {}, "permite_mismodia": False,
            "opciones": [],
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # MDF MANUAL — tipo "manual"
    # El usuario ingresa precio y costo directamente
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "MDF Manual",
        "tipo_calculo": "manual",
        "categoria_display": "MDF", "icono": "🪵", "orden": 44,
        "config": {},
    },

    # ══════════════════════════════════════════════════════════════════════════
    # TERMOS DEL CLIENTE (ajenos) — tipo "precio_fijo"
    # costo = $0 (el termo es del cliente)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Termo del cliente — 1 cara",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Termos", "icono": "☕", "orden": 50,
        "config": {"precio_base": 100, "costo_base": 0, "urgencia": {}, "permite_mismodia": False, "opciones": []},
    },
    {
        "nombre": "Termo del cliente — 2 caras",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Termos", "icono": "☕", "orden": 51,
        "config": {"precio_base": 150, "costo_base": 0, "urgencia": {}, "permite_mismodia": False, "opciones": []},
    },
    {
        "nombre": "Termo del cliente — Mayoreo corto",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Termos", "icono": "☕", "orden": 52,
        "config": {"precio_base": 60, "costo_base": 0, "urgencia": {}, "permite_mismodia": False, "opciones": []},
    },
    {
        "nombre": "Termo del cliente — Mayoreo nombre",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Termos", "icono": "☕", "orden": 53,
        "config": {"precio_base": 80, "costo_base": 0, "urgencia": {}, "permite_mismodia": False, "opciones": []},
    },

    # ══════════════════════════════════════════════════════════════════════════
    # NUESTRO TERMO — tipo "precio_fijo"
    # Descuentos por cantidad: 5+ piezas -10%, 10+ piezas -15%
    # urgente +20%, sin mismo día
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Nuestro termo (20 oz / 30 oz)",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Termos", "icono": "☕", "orden": 54,
        "config": {
            "precio_base": 300, "costo_base": 130,
            "urgencia": _urg_solo_urgente(), "permite_mismodia": False,
            "descuentos_cantidad": [
                {"cantidad_minima": 5,  "descuento_pct": 0.10},
                {"cantidad_minima": 10, "descuento_pct": 0.15},
            ],
            "opciones": [],
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # DISPLAYS — tipo "precio_fijo"
    # urgente +30% (excepción: la mayoría usa 20%)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Display estándar 16 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Displays", "icono": "🖼️", "orden": 60,
        "config": {
            "precio_base": 600, "costo_base": 60,
            "urgencia": _urg_solo_urgente(0.30), "permite_mismodia": False,
            "opciones": _DISPLAY_OPCIONES,
        },
    },
    {
        "nombre": "Display estándar 20 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Displays", "icono": "🖼️", "orden": 61,
        "config": {
            "precio_base": 700, "costo_base": 78,
            "urgencia": _urg_solo_urgente(0.30), "permite_mismodia": False,
            "opciones": _DISPLAY_OPCIONES,
        },
    },
    {
        "nombre": "Display premium 16 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Displays", "icono": "🖼️", "orden": 62,
        "config": {
            "precio_base": 800, "costo_base": 90,
            "urgencia": _urg_solo_urgente(0.30), "permite_mismodia": False,
            "opciones": _DISPLAY_OPCIONES,
        },
    },
    {
        "nombre": "Display premium 20 cm",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Displays", "icono": "🖼️", "orden": 63,
        "config": {
            "precio_base": 950, "costo_base": 110,
            "urgencia": _urg_solo_urgente(0.30), "permite_mismodia": False,
            "opciones": _DISPLAY_OPCIONES,
        },
    },
    {
        "nombre": "Display personalizado",
        "tipo_calculo": "manual",
        "categoria_display": "Displays", "icono": "🖼️", "orden": 64,
        "config": {},
    },

    # ══════════════════════════════════════════════════════════════════════════
    # GRABADO LÁSER — tipo "precio_fijo"
    # costo = precio_base × 0.15
    # Campo "objeto": descripción del artículo (tiene_campo_objeto = True)
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Grabado pequeño $100 — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 70,
        "config": {"precio_base": 100, "costo_base": 15, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado pequeño $120 — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 71,
        "config": {"precio_base": 120, "costo_base": 18, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado mediano $150 — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 72,
        "config": {"precio_base": 150, "costo_base": 22.5, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado mediano $200 — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 73,
        "config": {"precio_base": 200, "costo_base": 30, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado grande $250 — cliente nuevo",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 74,
        "config": {"precio_base": 250, "costo_base": 37.5, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado pequeño $60 — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 75,
        "config": {"precio_base": 60, "costo_base": 9, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado pequeño $80 — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 76,
        "config": {"precio_base": 80, "costo_base": 12, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado mediano $100 — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 77,
        "config": {"precio_base": 100, "costo_base": 15, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado mediano $150 — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 78,
        "config": {"precio_base": 150, "costo_base": 22.5, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },
    {
        "nombre": "Grabado grande $180 — cliente frecuente",
        "tipo_calculo": "precio_fijo",
        "categoria_display": "Grabado Láser", "icono": "✏️", "orden": 79,
        "config": {"precio_base": 180, "costo_base": 27, "urgencia": _urg_std(), "permite_mismodia": True, "tiene_campo_objeto": True, "opciones": []},
    },

    # ══════════════════════════════════════════════════════════════════════════
    # CORTE SIMPLE — tipo "por_dimension"
    # precio = factor_a × area × multiplicador_precio
    # costo  = factor_a × area × cantidad
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Corte láser — Acrílico",
        "tipo_calculo": "por_dimension",
        "categoria_display": "Corte Simple", "icono": "✂️", "orden": 80,
        "config": {
            "factor_a": 0.04, "factor_b": 0,
            "multiplicador_precio": 3,
            "costo_extra_por_pieza": 0,
            "ancho_default": 30, "alto_default": 30,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": [],
        },
    },
    {
        "nombre": "Corte láser — MDF",
        "tipo_calculo": "por_dimension",
        "categoria_display": "Corte Simple", "icono": "✂️", "orden": 81,
        "config": {
            "factor_a": 0.006, "factor_b": 0,
            "multiplicador_precio": 5,
            "costo_extra_por_pieza": 0,
            "ancho_default": 30, "alto_default": 30,
            "urgencia": _urg_std(), "permite_mismodia": True,
            "opciones": [],
        },
    },

    # ══════════════════════════════════════════════════════════════════════════
    # TRABAJO PERSONALIZADO — tipo "por_hora"
    # precio = (horas × (hora_objetivo + hora_laser) + materiales + extras) × (1 + margen_extra/100)
    # costo  = horas × hora_laser + materiales
    # hora_objetivo y hora_laser vienen de ConfiguracionSistema
    # ══════════════════════════════════════════════════════════════════════════
    {
        "nombre": "Trabajo personalizado",
        "tipo_calculo": "por_hora",
        "categoria_display": "Personalizado", "icono": "⚙️", "orden": 90,
        "config": {
            "usa_hora_objetivo": True,
            "usa_hora_laser": True,
            "incluye_materiales": True,
            "incluye_extras": True,
            "permite_margen_extra": True,
            "horas_default": 2,
            "materiales_default": 0,
            "extras_default": 0,
            "margen_extra_default": 0,
        },
    },
]


# ─── Funciones de migración ───────────────────────────────────────────────────

def poblar(apps, schema_editor):
    Producto = apps.get_model("productos", "Producto")
    ConfiguracionSistema = apps.get_model("productos", "ConfiguracionSistema")

    ConfiguracionSistema.objects.get_or_create(
        pk=1,
        defaults={"hora_objetivo": 230, "hora_laser": 30, "meta_mensual": 20000},
    )

    for datos in PRODUCTOS:
        Producto.objects.get_or_create(
            nombre=datos["nombre"],
            defaults={
                "tipo_calculo": datos["tipo_calculo"],
                "categoria_display": datos["categoria_display"],
                "icono": datos["icono"],
                "config": datos["config"],
                "activo": True,
                "orden": datos["orden"],
            },
        )


def despoblar(apps, schema_editor):
    Producto = apps.get_model("productos", "Producto")
    ConfiguracionSistema = apps.get_model("productos", "ConfiguracionSistema")
    Producto.objects.all().delete()
    ConfiguracionSistema.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("productos", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(poblar, despoblar),
    ]
