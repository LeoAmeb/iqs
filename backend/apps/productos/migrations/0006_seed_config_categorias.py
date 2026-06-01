"""
Migración de datos: siembra tipo_calculo y config en cada Categoría
a partir de la lógica del cotizador.html original.

Las 9 categorías del negocio:
  Logos, Neones, Toppers, MDF, Termos, Displays, Grabado Láser,
  Corte Simple, Personalizado.

Si la categoría no existe en la BD se crea con icono y orden por defecto.
"""

from django.db import migrations

SEED = [
    # ─── LOGOS ──────────────────────────────────────────────────────────────────
    # Modo principal: logo con base (precio_fijo).
    # El tamaño actúa como base de precio mediante un select que parte de $0.
    # Nota: "sin base" (por_dimension) se puede configurar como una segunda
    # categoría o como un modo adicional vía la UI de administración.
    {
        "nombre": "Logos",
        "icono": "🔤",
        "orden": 10,
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {
                "urgente":  {"pct": 0.20},
                "mismodia": {"pct": 0.50},
            },
            "permite_mismodia": True,
            "opciones": [
                {
                    "id": "tamano",
                    "tipo": "select",
                    "label": "Tamaño",
                    "valores": [
                        # costo = tam² × 0.04 × 2
                        {"id": "50cm", "label": "50cm — $1,590", "precio_delta": 1590, "costo_delta": 200},
                        {"id": "60cm", "label": "60cm — $2,090", "precio_delta": 2090, "costo_delta": 288},
                        {"id": "80cm", "label": "80cm — $3,490", "precio_delta": 3490, "costo_delta": 512},
                        {"id": "90cm", "label": "90cm — $3,990", "precio_delta": 3990, "costo_delta": 648},
                    ],
                },
                {
                    "id": "chapetones_dorados",
                    "label": "Chapetones dorados (+$100)",
                    "precio_delta": 100,
                    "costo_delta": 0,
                    "multiplicado": True,
                },
                {
                    "id": "tercera_capa",
                    "label": "3ra capa +$350",
                    "precio_delta": 350,
                    "costo_delta": 0,
                    "multiplicado": True,
                },
                {
                    "id": "led",
                    "label": "Iluminación LED",
                    "precio_delta": 0,
                    "costo_delta": 105,
                    "multiplicado": True,
                },
                {
                    # Instalación: costo fijo independiente de cantidad
                    "id": "instalacion",
                    "label": "Instalación +$300",
                    "precio_delta": 300,
                    "costo_delta": 0,
                    "multiplicado": False,
                },
            ],
        },
    },

    # ─── NEONES ─────────────────────────────────────────────────────────────────
    # Precios: 1050 | 1700 | 2800 | 3900 según tipo.
    # Costo base: metros×32+223; "hasta 5m" ≈ 4m → 4×32+223 = 351
    {
        "nombre": "Neones",
        "icono": "💡",
        "orden": 20,
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 351,
            "urgencia": {
                "urgente":  {"pct": 0.20},
                "mismodia": {"pct": 0.50},
            },
            "permite_mismodia": True,
            "opciones": [
                {
                    "id": "tipo",
                    "tipo": "select",
                    "label": "Tipo de neon",
                    "valores": [
                        {"id": "numero",    "label": "Número — $1,050",      "precio_delta": 1050, "costo_delta": 0},
                        {"id": "frase",     "label": "Frase simple — $1,700","precio_delta": 1700, "costo_delta": 0},
                        {"id": "complejo",  "label": "Complejo — $2,800",    "precio_delta": 2800, "costo_delta": 0},
                        {"id": "logo_neon", "label": "Logo neon — $3,900",   "precio_delta": 3900, "costo_delta": 0},
                    ],
                },
                {
                    "id": "complejidad",
                    "tipo": "select",
                    "label": "Complejidad extra",
                    "valores": [
                        {"id": "normal",      "label": "Normal",              "precio_delta": 0},
                        {"id": "complejo",    "label": "Complejo +$400",      "precio_delta": 400},
                        {"id": "muy_complejo","label": "Muy complejo +$600",  "precio_delta": 600},
                    ],
                },
                {
                    "id": "metraje",
                    "tipo": "select",
                    "label": "Metraje",
                    # costo base asume ~4m (351). Deltas: 7m→447 (+96), 10m→543 (+192)
                    "valores": [
                        {"id": "normal", "label": "Hasta 5m",       "precio_delta": 0,   "costo_delta": 0},
                        {"id": "medio",  "label": "5–10m +$250",    "precio_delta": 250, "costo_delta": 96},
                        {"id": "largo",  "label": "+10m +$350",     "precio_delta": 350, "costo_delta": 192},
                    ],
                },
                {
                    "id": "chapetones_dorados",
                    "label": "Chapetones dorados (+$100)",
                    "precio_delta": 100,
                    "costo_delta": 0,
                    "multiplicado": True,
                },
                {
                    "id": "apagador",
                    "label": "Apagador +$120",
                    "precio_delta": 120,
                    "costo_delta": 0,
                    "multiplicado": True,
                },
                {
                    "id": "instalacion",
                    "label": "Instalación +$300",
                    "precio_delta": 300,
                    "costo_delta": 0,
                    "multiplicado": False,
                },
            ],
        },
    },

    # ─── TOPPERS ────────────────────────────────────────────────────────────────
    # Precios: 15cm nuevo=$150, 15cm frecuente=$100, 10-12cm nuevo=$120, 10-12cm frecuente=$85
    # Costo: 15cm=18, 10-12cm=12. Urgente: +20%
    {
        "nombre": "Toppers",
        "icono": "🎂",
        "orden": 30,
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {
                "urgente": {"pct": 0.20},
            },
            "opciones": [
                {
                    "id": "variante",
                    "tipo": "select",
                    "label": "Tamaño · Tipo de cliente",
                    "valores": [
                        {"id": "15cm_nuevo",      "label": "15cm · Cliente nuevo",     "precio_delta": 150, "costo_delta": 18},
                        {"id": "15cm_frecuente",  "label": "15cm · Cliente frecuente", "precio_delta": 100, "costo_delta": 18},
                        {"id": "10_12cm_nuevo",   "label": "10–12cm · Cliente nuevo",  "precio_delta": 120, "costo_delta": 12},
                        {"id": "10_12cm_frecuente","label": "10–12cm · Frecuente",     "precio_delta": 85,  "costo_delta": 12},
                    ],
                },
                {
                    # Pieza adicional pequeña — precio fijo sin importar cantidad
                    "id": "pieza_extra_50",
                    "label": "Pieza adicional +$50",
                    "precio_delta": 50,
                    "costo_delta": 0,
                    "multiplicado": False,
                },
                {
                    "id": "pieza_extra_60",
                    "label": "Pieza adicional +$60",
                    "precio_delta": 60,
                    "costo_delta": 0,
                    "multiplicado": False,
                },
            ],
        },
    },

    # ─── MDF ────────────────────────────────────────────────────────────────────
    # Tiene 4 sub-modos: nombres, bases (tabla tiered), llaveros, manual.
    # Se almacena como tabla_tiered para el modo "Bases Pastel" (el más
    # estructurado). Los demás modos quedan documentados en la metadata.
    #
    # BASES_V  (mayoreo ≥20 pzas) y BASES_MINI (menudeo <20):
    #   3mm    : {12x12:10/16, 16x16:12/18, 22x22:16/24, 25x25:18/28, 28x28:22/34, 30x30:25/38}
    #   6mm    : {12x12:18/28, 16x16:22/34, 22x22:28/42, 25x25:32/48, 28x28:40/60, 30x30:44/66}
    #   6blanco: {12x12:20/30, 16x16:24/36, 22x22:32/48, 25x25:36/54, 28x28:44/66, 30x30:50/76}
    # MDF_CM2C: 3mm=0.006, 6mm=0.0084, 6blanco=0.0094
    # BASES_CM2: 12x12=144, 16x16=256, 22x22=484, 25x25=625, 28x28=784, 30x30=900
    {
        "nombre": "MDF",
        "icono": "🪵",
        "orden": 40,
        "tipo_calculo": "tabla_tiered",
        "config": {
            "umbral_mayoreo": 20,
            "dimensiones": ["12x12", "16x16", "22x22", "25x25", "28x28", "30x30"],
            "filas": [
                # MDF 3mm
                {"material": "MDF 3mm",      "medida": "12x12", "precio_menudeo": 16, "precio_mayoreo": 10, "factor_costo_cm2": 0.006,  "cm2": 144},
                {"material": "MDF 3mm",      "medida": "16x16", "precio_menudeo": 18, "precio_mayoreo": 12, "factor_costo_cm2": 0.006,  "cm2": 256},
                {"material": "MDF 3mm",      "medida": "22x22", "precio_menudeo": 24, "precio_mayoreo": 16, "factor_costo_cm2": 0.006,  "cm2": 484},
                {"material": "MDF 3mm",      "medida": "25x25", "precio_menudeo": 28, "precio_mayoreo": 18, "factor_costo_cm2": 0.006,  "cm2": 625},
                {"material": "MDF 3mm",      "medida": "28x28", "precio_menudeo": 34, "precio_mayoreo": 22, "factor_costo_cm2": 0.006,  "cm2": 784},
                {"material": "MDF 3mm",      "medida": "30x30", "precio_menudeo": 38, "precio_mayoreo": 25, "factor_costo_cm2": 0.006,  "cm2": 900},
                # MDF 6mm natural
                {"material": "MDF 6mm",      "medida": "12x12", "precio_menudeo": 28, "precio_mayoreo": 18, "factor_costo_cm2": 0.0084, "cm2": 144},
                {"material": "MDF 6mm",      "medida": "16x16", "precio_menudeo": 34, "precio_mayoreo": 22, "factor_costo_cm2": 0.0084, "cm2": 256},
                {"material": "MDF 6mm",      "medida": "22x22", "precio_menudeo": 42, "precio_mayoreo": 28, "factor_costo_cm2": 0.0084, "cm2": 484},
                {"material": "MDF 6mm",      "medida": "25x25", "precio_menudeo": 48, "precio_mayoreo": 32, "factor_costo_cm2": 0.0084, "cm2": 625},
                {"material": "MDF 6mm",      "medida": "28x28", "precio_menudeo": 60, "precio_mayoreo": 40, "factor_costo_cm2": 0.0084, "cm2": 784},
                {"material": "MDF 6mm",      "medida": "30x30", "precio_menudeo": 66, "precio_mayoreo": 44, "factor_costo_cm2": 0.0084, "cm2": 900},
                # MDF 6mm blanco
                {"material": "MDF 6mm blanco","medida": "12x12", "precio_menudeo": 30, "precio_mayoreo": 20, "factor_costo_cm2": 0.0094, "cm2": 144},
                {"material": "MDF 6mm blanco","medida": "16x16", "precio_menudeo": 36, "precio_mayoreo": 24, "factor_costo_cm2": 0.0094, "cm2": 256},
                {"material": "MDF 6mm blanco","medida": "22x22", "precio_menudeo": 48, "precio_mayoreo": 32, "factor_costo_cm2": 0.0094, "cm2": 484},
                {"material": "MDF 6mm blanco","medida": "25x25", "precio_menudeo": 54, "precio_mayoreo": 36, "factor_costo_cm2": 0.0094, "cm2": 625},
                {"material": "MDF 6mm blanco","medida": "28x28", "precio_menudeo": 66, "precio_mayoreo": 44, "factor_costo_cm2": 0.0094, "cm2": 784},
                {"material": "MDF 6mm blanco","medida": "30x30", "precio_menudeo": 76, "precio_mayoreo": 50, "factor_costo_cm2": 0.0094, "cm2": 900},
            ],
            # ── Modos alternativos (referencia para la UI) ───────────────────
            "modos_extra": {
                "nombres": {
                    "descripcion": "Letras/Nombres cortados",
                    "tipo_calculo": "precio_fijo",
                    "precio_base": 0,
                    "costo_base": 0,
                    "urgencia": {"urgente": {"pct": 0.20}, "mismodia": {"pct": 0.50}},
                    "opciones": [
                        {
                            "id": "tamano",
                            "tipo": "select",
                            "label": "Tamaño",
                            "valores": [
                                # costo: tam² × 0.006
                                {"id": "60cm", "label": "60cm — $150", "precio_delta": 150, "costo_delta": 216},
                                {"id": "80cm", "label": "80cm — $260", "precio_delta": 260, "costo_delta": 384},
                            ],
                        },
                        {
                            "id": "pintado",
                            "label": "Pintado +$100",
                            "precio_delta": 100,
                            "costo_delta": 33,
                            "multiplicado": True,
                        },
                        {
                            "id": "vinil",
                            "tipo": "number",
                            "label": "Vinil (metros)",
                            "precio_por_unidad": 120,
                            "costo_por_unidad": 60,
                        },
                    ],
                },
                "llaveros": {
                    "descripcion": "Llaveros 5×5cm grabado — $15/pz, mín. 20 pzas",
                    "precio_unitario": 15,
                    "costo_unitario": 1.15,
                },
            },
        },
    },

    # ─── TERMOS ─────────────────────────────────────────────────────────────────
    # Modo principal: nosotros incluimos el termo ($300 c/u, costo $130).
    # Descuentos por volumen: 5+ pzas −10%, 10+ pzas −15%.
    # El select "modalidad" cubre también el caso "cliente trae su termo".
    {
        "nombre": "Termos",
        "icono": "☕",
        "orden": 50,
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {
                "urgente": {"pct": 0.20},
            },
            "descuentos_cantidad": [
                # Solo aplican para termos con nuestro termo (modalidades nuestro_*)
                {"min_cantidad": 5,  "pct": -0.10},
                {"min_cantidad": 10, "pct": -0.15},
            ],
            "opciones": [
                {
                    "id": "modalidad",
                    "tipo": "select",
                    "label": "Tipo de servicio",
                    "valores": [
                        {"id": "nuestro_20oz",    "label": "Nuestro termo 20oz + grabado — $300", "precio_delta": 300, "costo_delta": 130},
                        {"id": "nuestro_30oz",    "label": "Nuestro termo 30oz + grabado — $300", "precio_delta": 300, "costo_delta": 130},
                        {"id": "propio_1diseno",  "label": "Grabado 1 diseño (termo del cliente) — $100", "precio_delta": 100, "costo_delta": 0},
                        {"id": "propio_2disenos", "label": "Grabado 2 diseños (termo del cliente) — $150", "precio_delta": 150, "costo_delta": 0},
                        {"id": "mayoreo_corto",   "label": "Mayoreo grabado corto — $60/pz", "precio_delta": 60, "costo_delta": 0},
                        {"id": "mayoreo_nombre",  "label": "Mayoreo nombre completo — $80/pz", "precio_delta": 80, "costo_delta": 0},
                    ],
                },
            ],
        },
    },

    # ─── DISPLAYS ───────────────────────────────────────────────────────────────
    # Tipos: 600/700/800/950. Costos: 60/78/90/110. Urgente: +30%.
    {
        "nombre": "Displays",
        "icono": "🖼️",
        "orden": 60,
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {
                "urgente": {"pct": 0.30},
            },
            "opciones": [
                {
                    "id": "tipo",
                    "tipo": "select",
                    "label": "Tipo de display",
                    "valores": [
                        {"id": "16cm_std",  "label": "16cm estándar — $600", "precio_delta": 600, "costo_delta": 60},
                        {"id": "20cm_std",  "label": "20cm estándar — $700", "precio_delta": 700, "costo_delta": 78},
                        {"id": "16cm_prem", "label": "16cm premium — $800",  "precio_delta": 800, "costo_delta": 90},
                        {"id": "20cm_prem", "label": "20cm premium — $950",  "precio_delta": 950, "costo_delta": 110},
                    ],
                },
                {
                    "id": "tercera_capa",
                    "label": "3ra capa +$150",
                    "precio_delta": 150,
                    "costo_delta": 0,
                    "multiplicado": True,
                },
            ],
        },
    },

    # ─── GRABADO LÁSER ──────────────────────────────────────────────────────────
    # Precios por tipo_cliente × tamaño × opción de precio:
    #   nuevo   : pequeño=[100,120], mediano=[150,200], grande=[250]
    #   frecuente: pequeño=[60,80],  mediano=[100,150], grande=[180]
    # Costo = precio × 0.15. Urgente +20%, mismo día +50%.
    {
        "nombre": "Grabado Láser",
        "icono": "✏️",
        "orden": 70,
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {
                "urgente":  {"pct": 0.20},
                "mismodia": {"pct": 0.50},
            },
            "permite_mismodia": True,
            "opciones": [
                {
                    "id": "variante",
                    "tipo": "select",
                    "label": "Cliente · Tamaño · Precio",
                    "valores": [
                        # --- Cliente nuevo ---
                        {"id": "n_p_100", "label": "Nuevo · Pequeño — $100", "precio_delta": 100, "costo_delta": 15},
                        {"id": "n_p_120", "label": "Nuevo · Pequeño — $120", "precio_delta": 120, "costo_delta": 18},
                        {"id": "n_m_150", "label": "Nuevo · Mediano — $150", "precio_delta": 150, "costo_delta": 22.50},
                        {"id": "n_m_200", "label": "Nuevo · Mediano — $200", "precio_delta": 200, "costo_delta": 30},
                        {"id": "n_g_250", "label": "Nuevo · Grande — $250",  "precio_delta": 250, "costo_delta": 37.50},
                        # --- Cliente frecuente ---
                        {"id": "f_p_60",  "label": "Frecuente · Pequeño — $60",  "precio_delta": 60,  "costo_delta": 9},
                        {"id": "f_p_80",  "label": "Frecuente · Pequeño — $80",  "precio_delta": 80,  "costo_delta": 12},
                        {"id": "f_m_100", "label": "Frecuente · Mediano — $100", "precio_delta": 100, "costo_delta": 15},
                        {"id": "f_m_150", "label": "Frecuente · Mediano — $150", "precio_delta": 150, "costo_delta": 22.50},
                        {"id": "f_g_180", "label": "Frecuente · Grande — $180",  "precio_delta": 180, "costo_delta": 27},
                    ],
                },
            ],
        },
    },

    # ─── CORTE SIMPLE ───────────────────────────────────────────────────────────
    # Precio = área × factor_a (precio por cm²).
    # Acrílico: factor_a = costo(0.04)×3 = 0.12 | costo_factor = 0.04
    # MDF:      factor_a = costo(0.006)×5 = 0.03 | costo_factor = 0.006
    # Se almacena el config de acrílico como primario y se incluye metadata
    # para el material alternativo.
    {
        "nombre": "Corte Simple",
        "icono": "✂️",
        "orden": 80,
        "tipo_calculo": "por_dimension",
        "config": {
            # Acrílico (material predeterminado)
            "factor_a": 0.12,
            "factor_b": 0,
            "precio_minimo": 0,
            "costo_factor": 0.04,
            "urgencia": {
                "urgente":  {"pct": 0.20},
                "mismodia": {"pct": 0.50},
            },
            # Metadata para la UI — permite ofrecer selección de material
            "materiales": [
                {
                    "id": "acrilico",
                    "label": "Acrílico (×3)",
                    "factor_a": 0.12,
                    "costo_factor": 0.04,
                },
                {
                    "id": "mdf",
                    "label": "MDF (×5)",
                    "factor_a": 0.03,
                    "costo_factor": 0.006,
                },
            ],
        },
    },

    # ─── PERSONALIZADO ──────────────────────────────────────────────────────────
    # Trabajo libre: horas + materiales + extras + margen.
    # Usa hora_objetivo y hora_laser de ConfiguracionSistema.
    {
        "nombre": "Personalizado",
        "icono": "⚙️",
        "orden": 90,
        "tipo_calculo": "por_hora",
        "config": {},
    },
]


def seed(apps, schema_editor):
    Categoria = apps.get_model("productos", "Categoria")

    for datos in SEED:
        cat, created = Categoria.objects.get_or_create(
            nombre=datos["nombre"],
            defaults={
                "icono": datos["icono"],
                "orden": datos["orden"],
                "activo": True,
                "tipo_calculo": datos["tipo_calculo"],
                "config": datos["config"],
            },
        )
        if not created:
            # Actualizar siempre tipo_calculo y config (pueden venir vacíos
            # de la migración 0004 que solo rellenó nombre/icono/orden).
            cat.tipo_calculo = datos["tipo_calculo"]
            cat.config = datos["config"]
            cat.icono = datos["icono"]
            cat.orden = datos["orden"]
            cat.save(update_fields=["tipo_calculo", "config", "icono", "orden"])


def unseed(apps, schema_editor):
    # Reversión: limpiar config y restablecer tipo_calculo al valor por defecto
    Categoria = apps.get_model("productos", "Categoria")
    nombres = [d["nombre"] for d in SEED]
    Categoria.objects.filter(nombre__in=nombres).update(
        tipo_calculo="precio_fijo",
        config={},
    )


class Migration(migrations.Migration):

    dependencies = [
        ("productos", "0005_categoria_config_categoria_tipo_calculo"),
    ]

    operations = [
        migrations.RunPython(seed, reverse_code=unseed),
    ]
