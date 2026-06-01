# Configuración de Categorías — Referencia

Cada `Categoria` tiene dos campos clave:

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo_calculo` | `string` enum | Determina la fórmula que usa el cotizador |
| `config` | `JSONField` | Parámetros específicos del tipo de cálculo |

El cotizador lee ambos en `GET /api/v1/productos/cotizador/` y los pasa al componente `FormularioProducto`.

---

## Tipos de cálculo (`tipo_calculo`)

| Valor | Fórmula | Categorías actuales |
|---|---|---|
| `precio_fijo` | Base + suma de opciones seleccionadas | Logos, Neones, Toppers, Termos, Displays, Grabado Láser |
| `por_dimension` | `max(ancho × alto × factor_a + factor_b, precio_minimo)` | Corte Simple |
| `tabla_tiered` | Lookup en tabla por (material, medida) + mayoreo por volumen | MDF |
| `por_hora` | `horas × hora_objetivo + materiales + extras` (tarifas globales) | Personalizado |
| `manual` | Precio y costo ingresados manualmente al cotizar | — |

---

## 1. `precio_fijo`

La mayoría de las categorías usa este tipo.

```jsonc
{
  "precio_base": 0,          // Precio de partida antes de opciones
  "costo_base": 0,           // Costo de partida

  // Urgencias — cada clave es un multiplicador sobre el precio final
  "urgencia": {
    "urgente":  { "pct": 0.20 },   // +20%
    "mismodia": { "pct": 0.50 }    // +50%
  },
  "permite_mismodia": true,  // Si false, la opción "mismo día" no aparece en el cotizador

  // Descuentos por volumen (opcional) — se aplican antes de urgencia
  "descuentos_cantidad": [
    { "min_cantidad": 5,  "pct": -0.10 },  // ≥5 pzas → −10%
    { "min_cantidad": 10, "pct": -0.15 }   // ≥10 pzas → −15%
  ],

  // Lista de opciones que aparecen en el formulario del cotizador
  "opciones": [ /* ver sección Opciones */ ]
}
```

### Opciones (`opciones[]`)

Hay tres tipos de opción, diferenciados por el campo `tipo`.

#### Tipo `checkbox` (sin campo `tipo`)

Aparece como botón toggle. El precio delta se suma al precio unitario.

```jsonc
{
  "id": "instalacion",          // Identificador único dentro de la categoría
  "label": "Instalación +$300", // Texto visible en el cotizador
  "precio_delta": 300,          // Se suma al precio
  "costo_delta": 0,             // Se suma al costo
  "multiplicado": false,        // true → delta × cantidad; false → delta fijo (se prorratea)
  "grupo": "extras"             // Opcional: "extras" mueve la opción a la sección de píldoras
}
```

#### Tipo `select`

Desplegable de opciones mutuamente excluyentes. El `precio_delta` de la opción base no se usa; cada valor tiene su propio delta.

```jsonc
{
  "id": "tamano",
  "tipo": "select",
  "label": "Tamaño",
  "valores": [
    { "id": "50cm", "label": "50cm — $1,590", "precio_delta": 1590, "costo_delta": 200 },
    { "id": "60cm", "label": "60cm — $2,090", "precio_delta": 2090, "costo_delta": 288 }
  ]
  // "grupo" también aplica aquí si se quiere mover a sección Extras
}
```

#### Tipo `number`

Campo numérico. El precio se calcula como `valor_ingresado × precio_por_unidad`.

```jsonc
{
  "id": "vinil",
  "tipo": "number",
  "label": "Vinil (metros)",
  "precio_por_unidad": 120,
  "costo_por_unidad": 60
}
```

### El campo `grupo`

Controla dónde se renderiza la opción en el formulario:

| Valor | Comportamiento |
|---|---|
| _(ausente)_ | Se muestra en la sección principal (selects y checkboxes de ancho completo) |
| `"extras"` | Se mueve a la sección "Extras" (píldoras compactas con flex-wrap) |

---

## 2. `por_dimension`

```jsonc
{
  "factor_a": 0.12,       // Precio por cm²
  "factor_b": 0,          // Precio fijo adicional (generalmente 0)
  "precio_minimo": 0,     // Precio mínimo aunque el área sea pequeña
  "costo_factor": 0.04,   // Costo por cm²

  "urgencia": {
    "urgente":  { "pct": 0.20 },
    "mismodia": { "pct": 0.50 }
  },

  // Metadata de materiales disponibles (informativo para la UI)
  "materiales": [
    { "id": "acrilico", "label": "Acrílico (×3)", "factor_a": 0.12, "costo_factor": 0.04 },
    { "id": "mdf",      "label": "MDF (×5)",      "factor_a": 0.03, "costo_factor": 0.006 }
  ]
}
```

**Fórmula completa:**

```
precio_unit = max(ancho × alto × factor_a + factor_b, precio_minimo)
              × (1 + urgencia.pct)   // si se seleccionó urgencia
costo_unit  = ancho × alto × costo_factor
```

---

## 3. `tabla_tiered`

Pensado para MDF: precio unitario depende del material, medida y volumen total del carrito.

```jsonc
{
  "umbral_mayoreo": 20,   // A partir de este número de piezas en el carrito → precio mayoreo

  "dimensiones": ["12x12", "16x16", "22x22", "25x25", "28x28", "30x30"],  // Metadato UI

  "filas": [
    {
      "material": "MDF 3mm",  // Texto que aparece en el select "Material"
      "medida": "12x12",      // Texto que aparece en el select "Medida"
      "precio_menudeo": 16,   // Precio cuando totalPiezasCarrito < umbral_mayoreo
      "precio_mayoreo": 10,   // Precio cuando totalPiezasCarrito >= umbral_mayoreo
      "factor_costo_cm2": 0.006,  // Costo = cm2 × factor_costo_cm2
      "cm2": 144              // Área de la pieza (para calcular costo)
    }
    // ... una fila por cada combinación material × medida
  ],

  // Modos alternativos — metadato para referencia, no afecta el cálculo principal
  "modos_extra": {
    "nombres": { /* config precio_fijo para letras/nombres */ },
    "llaveros": { "precio_unitario": 15, "costo_unitario": 1.15 }
  }
}
```

**Lógica de precio:**

```
totalPiezas = piezas_en_carrito_tiered + cantidad_actual
esMayoreo   = totalPiezas >= umbral_mayoreo
precioUnit  = esMayoreo ? fila.precio_mayoreo : fila.precio_menudeo
costoUnit   = fila.cm2 × fila.factor_costo_cm2
```

---

## 4. `por_hora`

Sin config propia; usa los parámetros globales de `ConfiguracionSistema`.

```jsonc
{}
```

Los parámetros relevantes están en `GET /api/v1/productos/configuracion/`:

| Campo | Descripción |
|---|---|
| `hora_objetivo` | Tarifa que se cobra por hora de trabajo ($/hr) |
| `hora_laser` | Costo interno de la hora máquina ($/hr) |

**Fórmula:**

```
costo   = horas × hora_laser + materiales + extras
precio  = (horas × hora_objetivo + materiales + extras) × (1 + margen_extra/100)
```

---

## 5. `manual`

Sin config. El cotizador muestra dos campos libres (precio y costo).

```jsonc
{}
```

---

## Dónde vive cada pieza

| Pieza | Ubicación |
|---|---|
| Modelo Django | `backend/apps/productos/models.py` → `Categoria` |
| Configs originales del negocio | `backend/apps/productos/defaults.py` → `CONFIG_BASE` |
| Seed inicial en BD | `backend/apps/productos/migrations/0006_seed_config_categorias.py` |
| Endpoint de lectura (cotizador) | `GET /api/v1/productos/cotizador/` |
| Endpoint CRUD | `GET/POST/PATCH /api/v1/productos/categorias/` |
| Endpoint reset | `POST /api/v1/productos/categorias/{id}/restablecer/` |
| Tipos TypeScript | `frontend/types/index.ts` → `Categoria`, `TipoCalculo` |
| Funciones de cálculo | `frontend/lib/cotizador/calculos.ts` |
| Formulario del cotizador | `frontend/app/(admin)/cotizador/_components/formulario-producto.tsx` |
| Editor visual (admin) | `frontend/app/(admin)/configuracion/_components/` |

---

## Cómo añadir una nueva categoría

1. Crear en la UI de Configuración (wizard paso a paso) — o directamente en Django Admin.
2. Si será una categoría permanente del negocio, agregar su entrada en `defaults.py` para que el endpoint `/restablecer/` pueda restaurarla.
3. El cotizador la mostrará automáticamente sin cambios de código (lee categorías activas de la BD).

## Cómo añadir un nuevo tipo de cálculo

1. Agregar el valor a `TipoCalculo` en `backend/apps/productos/models.py`.
2. Crear la función `calcularXxx` en `frontend/lib/cotizador/calculos.ts`.
3. Agregar el caso en `FormularioProducto.calcular()` y el bloque de campos de entrada.
4. Agregar el caso en `WizardCategoria` (tarjeta de selección + editor de config).
5. Si aplica, crear `EditorXxx` en `frontend/app/(admin)/configuracion/_components/`.
