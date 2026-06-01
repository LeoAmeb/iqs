"""
Configuraciones canónicas de cada categoría del negocio.

Fuente de verdad para el endpoint /categorias/{id}/restablecer/.
Combina los datos de las migraciones 0006 (seed inicial) y 0007
(grupo "extras" en opciones secundarias).
"""

CONFIG_BASE: dict[str, dict] = {
    # ─── LOGOS ───────────────────────────────────────────────────────────────
    "Logos": {
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
                    "grupo": "extras",
                },
                {
                    "id": "tercera_capa",
                    "label": "3ra capa +$350",
                    "precio_delta": 350,
                    "costo_delta": 0,
                    "multiplicado": True,
                    "grupo": "extras",
                },
                {
                    "id": "led",
                    "label": "Iluminación LED",
                    "precio_delta": 0,
                    "costo_delta": 105,
                    "multiplicado": True,
                    "grupo": "extras",
                },
                {
                    "id": "instalacion",
                    "label": "Instalación +$300",
                    "precio_delta": 300,
                    "costo_delta": 0,
                    "multiplicado": False,
                    "grupo": "extras",
                },
            ],
        },
    },

    # ─── NEONES ──────────────────────────────────────────────────────────────
    "Neones": {
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
                        {"id": "numero",    "label": "Número — $1,050",       "precio_delta": 1050, "costo_delta": 0},
                        {"id": "frase",     "label": "Frase simple — $1,700", "precio_delta": 1700, "costo_delta": 0},
                        {"id": "complejo",  "label": "Complejo — $2,800",     "precio_delta": 2800, "costo_delta": 0},
                        {"id": "logo_neon", "label": "Logo neon — $3,900",    "precio_delta": 3900, "costo_delta": 0},
                    ],
                },
                {
                    "id": "complejidad",
                    "tipo": "select",
                    "label": "Complejidad extra",
                    "valores": [
                        {"id": "normal",       "label": "Normal",              "precio_delta": 0},
                        {"id": "complejo",     "label": "Complejo +$400",      "precio_delta": 400},
                        {"id": "muy_complejo", "label": "Muy complejo +$600",  "precio_delta": 600},
                    ],
                },
                {
                    "id": "metraje",
                    "tipo": "select",
                    "label": "Metraje",
                    "valores": [
                        {"id": "normal", "label": "Hasta 5m",    "precio_delta": 0,   "costo_delta": 0},
                        {"id": "medio",  "label": "5–10m +$250", "precio_delta": 250, "costo_delta": 96},
                        {"id": "largo",  "label": "+10m +$350",  "precio_delta": 350, "costo_delta": 192},
                    ],
                },
                {
                    "id": "chapetones_dorados",
                    "label": "Chapetones dorados (+$100)",
                    "precio_delta": 100,
                    "costo_delta": 0,
                    "multiplicado": True,
                    "grupo": "extras",
                },
                {
                    "id": "apagador",
                    "label": "Apagador +$120",
                    "precio_delta": 120,
                    "costo_delta": 0,
                    "multiplicado": True,
                    "grupo": "extras",
                },
                {
                    "id": "instalacion",
                    "label": "Instalación +$300",
                    "precio_delta": 300,
                    "costo_delta": 0,
                    "multiplicado": False,
                    "grupo": "extras",
                },
            ],
        },
    },

    # ─── TOPPERS ─────────────────────────────────────────────────────────────
    "Toppers": {
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {"urgente": {"pct": 0.20}},
            "opciones": [
                {
                    "id": "variante",
                    "tipo": "select",
                    "label": "Tamaño · Tipo de cliente",
                    "valores": [
                        {"id": "15cm_nuevo",       "label": "15cm · Cliente nuevo",     "precio_delta": 150, "costo_delta": 18},
                        {"id": "15cm_frecuente",   "label": "15cm · Cliente frecuente", "precio_delta": 100, "costo_delta": 18},
                        {"id": "10_12cm_nuevo",    "label": "10–12cm · Cliente nuevo",  "precio_delta": 120, "costo_delta": 12},
                        {"id": "10_12cm_frecuente","label": "10–12cm · Frecuente",      "precio_delta": 85,  "costo_delta": 12},
                    ],
                },
                {
                    "id": "pieza_extra_50",
                    "label": "Pieza adicional +$50",
                    "precio_delta": 50,
                    "costo_delta": 0,
                    "multiplicado": False,
                    "grupo": "extras",
                },
                {
                    "id": "pieza_extra_60",
                    "label": "Pieza adicional +$60",
                    "precio_delta": 60,
                    "costo_delta": 0,
                    "multiplicado": False,
                    "grupo": "extras",
                },
            ],
        },
    },

    # ─── MDF ─────────────────────────────────────────────────────────────────
    "MDF": {
        "tipo_calculo": "tabla_tiered",
        "config": {
            "umbral_mayoreo": 20,
            "dimensiones": ["12x12", "16x16", "22x22", "25x25", "28x28", "30x30"],
            "filas": [
                {"material": "MDF 3mm",       "medida": "12x12", "precio_menudeo": 16, "precio_mayoreo": 10, "factor_costo_cm2": 0.006,  "cm2": 144},
                {"material": "MDF 3mm",       "medida": "16x16", "precio_menudeo": 18, "precio_mayoreo": 12, "factor_costo_cm2": 0.006,  "cm2": 256},
                {"material": "MDF 3mm",       "medida": "22x22", "precio_menudeo": 24, "precio_mayoreo": 16, "factor_costo_cm2": 0.006,  "cm2": 484},
                {"material": "MDF 3mm",       "medida": "25x25", "precio_menudeo": 28, "precio_mayoreo": 18, "factor_costo_cm2": 0.006,  "cm2": 625},
                {"material": "MDF 3mm",       "medida": "28x28", "precio_menudeo": 34, "precio_mayoreo": 22, "factor_costo_cm2": 0.006,  "cm2": 784},
                {"material": "MDF 3mm",       "medida": "30x30", "precio_menudeo": 38, "precio_mayoreo": 25, "factor_costo_cm2": 0.006,  "cm2": 900},
                {"material": "MDF 6mm",       "medida": "12x12", "precio_menudeo": 28, "precio_mayoreo": 18, "factor_costo_cm2": 0.0084, "cm2": 144},
                {"material": "MDF 6mm",       "medida": "16x16", "precio_menudeo": 34, "precio_mayoreo": 22, "factor_costo_cm2": 0.0084, "cm2": 256},
                {"material": "MDF 6mm",       "medida": "22x22", "precio_menudeo": 42, "precio_mayoreo": 28, "factor_costo_cm2": 0.0084, "cm2": 484},
                {"material": "MDF 6mm",       "medida": "25x25", "precio_menudeo": 48, "precio_mayoreo": 32, "factor_costo_cm2": 0.0084, "cm2": 625},
                {"material": "MDF 6mm",       "medida": "28x28", "precio_menudeo": 60, "precio_mayoreo": 40, "factor_costo_cm2": 0.0084, "cm2": 784},
                {"material": "MDF 6mm",       "medida": "30x30", "precio_menudeo": 66, "precio_mayoreo": 44, "factor_costo_cm2": 0.0084, "cm2": 900},
                {"material": "MDF 6mm blanco","medida": "12x12", "precio_menudeo": 30, "precio_mayoreo": 20, "factor_costo_cm2": 0.0094, "cm2": 144},
                {"material": "MDF 6mm blanco","medida": "16x16", "precio_menudeo": 36, "precio_mayoreo": 24, "factor_costo_cm2": 0.0094, "cm2": 256},
                {"material": "MDF 6mm blanco","medida": "22x22", "precio_menudeo": 48, "precio_mayoreo": 32, "factor_costo_cm2": 0.0094, "cm2": 484},
                {"material": "MDF 6mm blanco","medida": "25x25", "precio_menudeo": 54, "precio_mayoreo": 36, "factor_costo_cm2": 0.0094, "cm2": 625},
                {"material": "MDF 6mm blanco","medida": "28x28", "precio_menudeo": 66, "precio_mayoreo": 44, "factor_costo_cm2": 0.0094, "cm2": 784},
                {"material": "MDF 6mm blanco","medida": "30x30", "precio_menudeo": 76, "precio_mayoreo": 50, "factor_costo_cm2": 0.0094, "cm2": 900},
            ],
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

    # ─── TERMOS ──────────────────────────────────────────────────────────────
    "Termos": {
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {"urgente": {"pct": 0.20}},
            "descuentos_cantidad": [
                {"min_cantidad": 5,  "pct": -0.10},
                {"min_cantidad": 10, "pct": -0.15},
            ],
            "opciones": [
                {
                    "id": "modalidad",
                    "tipo": "select",
                    "label": "Tipo de servicio",
                    "valores": [
                        {"id": "nuestro_20oz",    "label": "Nuestro termo 20oz + grabado — $300",            "precio_delta": 300, "costo_delta": 130},
                        {"id": "nuestro_30oz",    "label": "Nuestro termo 30oz + grabado — $300",            "precio_delta": 300, "costo_delta": 130},
                        {"id": "propio_1diseno",  "label": "Grabado 1 diseño (termo del cliente) — $100",    "precio_delta": 100, "costo_delta": 0},
                        {"id": "propio_2disenos", "label": "Grabado 2 diseños (termo del cliente) — $150",   "precio_delta": 150, "costo_delta": 0},
                        {"id": "mayoreo_corto",   "label": "Mayoreo grabado corto — $60/pz",                 "precio_delta": 60,  "costo_delta": 0},
                        {"id": "mayoreo_nombre",  "label": "Mayoreo nombre completo — $80/pz",               "precio_delta": 80,  "costo_delta": 0},
                    ],
                },
            ],
        },
    },

    # ─── DISPLAYS ────────────────────────────────────────────────────────────
    "Displays": {
        "tipo_calculo": "precio_fijo",
        "config": {
            "precio_base": 0,
            "costo_base": 0,
            "urgencia": {"urgente": {"pct": 0.30}},
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
                    "grupo": "extras",
                },
            ],
        },
    },

    # ─── GRABADO LÁSER ───────────────────────────────────────────────────────
    "Grabado Láser": {
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
                        {"id": "n_p_100", "label": "Nuevo · Pequeño — $100",     "precio_delta": 100, "costo_delta": 15},
                        {"id": "n_p_120", "label": "Nuevo · Pequeño — $120",     "precio_delta": 120, "costo_delta": 18},
                        {"id": "n_m_150", "label": "Nuevo · Mediano — $150",     "precio_delta": 150, "costo_delta": 22.50},
                        {"id": "n_m_200", "label": "Nuevo · Mediano — $200",     "precio_delta": 200, "costo_delta": 30},
                        {"id": "n_g_250", "label": "Nuevo · Grande — $250",      "precio_delta": 250, "costo_delta": 37.50},
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

    # ─── CORTE SIMPLE ────────────────────────────────────────────────────────
    "Corte Simple": {
        "tipo_calculo": "por_dimension",
        "config": {
            "factor_a": 0.12,
            "factor_b": 0,
            "precio_minimo": 0,
            "costo_factor": 0.04,
            "urgencia": {
                "urgente":  {"pct": 0.20},
                "mismodia": {"pct": 0.50},
            },
            "materiales": [
                {"id": "acrilico", "label": "Acrílico (×3)", "factor_a": 0.12, "costo_factor": 0.04},
                {"id": "mdf",      "label": "MDF (×5)",      "factor_a": 0.03, "costo_factor": 0.006},
            ],
        },
    },

    # ─── PERSONALIZADO ───────────────────────────────────────────────────────
    "Personalizado": {
        "tipo_calculo": "por_hora",
        "config": {},
    },
}
