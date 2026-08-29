export interface ResultadoCalculo {
  total: number
  costo: number
  iva: number
  ganancia: number
  margen: number
  precioUnit: number
}

function r2(n: number) { return Math.round(n * 100) / 100 }

function _resultado(precioUnit: number, costo: number, cantidad: number): ResultadoCalculo {
  const total = r2(precioUnit * cantidad)
  const costoTotal = r2(costo * cantidad)
  const iva = r2((total / 1.16) * 0.16)
  const ganancia = r2(total - costoTotal - iva)
  const margen = total > 0 ? Math.round((ganancia / total) * 10000) / 100 : 0
  return { total, costo: costoTotal, iva, ganancia, margen, precioUnit }
}

// ─── precio_fijo ──────────────────────────────────────────────────────────────

interface OpcionCheckbox {
  id: string
  tipo?: undefined
  label: string
  precio_delta: number
  costo_delta: number
  multiplicado: boolean
}

interface OpcionSelect {
  id: string
  tipo: "select"
  label: string
  valores: Array<{ id: string; label: string; precio_delta: number; costo_delta?: number }>
}

interface OpcionNumber {
  id: string
  tipo: "number"
  label: string
  precio_por_unidad: number
  costo_por_unidad?: number
}

type Opcion = OpcionCheckbox | OpcionSelect | OpcionNumber

interface DescuentoCantidad {
  min_cantidad: number
  pct: number
}

interface UrgenciaConfig {
  pct: number
}

interface PrecioFijoConfig {
  precio_base: number
  costo_base: number
  urgencia?: Record<string, UrgenciaConfig>
  permite_mismodia?: boolean
  opciones?: Opcion[]
  descuentos_cantidad?: DescuentoCantidad[]
}

interface PrecioFijoParams {
  cantidad: number
  urgencia?: string
  opciones_seleccionadas?: string[]
  opciones_select?: Record<string, string>
  opciones_number?: Record<string, number>
}

export function calcularPrecioFijo(
  params: PrecioFijoParams,
  config: PrecioFijoConfig
): ResultadoCalculo {
  let precio = config.precio_base
  let costo = config.costo_base
  const cant = params.cantidad || 1

  const seleccionadas = new Set(params.opciones_seleccionadas ?? [])

  for (const op of config.opciones ?? []) {
    if (op.tipo === "number") {
      const valor = params.opciones_number?.[op.id] ?? 0
      precio += valor * op.precio_por_unidad
      costo += valor * (op.costo_por_unidad ?? 0)
    } else if (op.tipo === "select") {
      const valorId = params.opciones_select?.[op.id]
      if (!valorId) continue
      const valor = op.valores.find((v) => v.id === valorId)
      if (!valor) continue
      precio += valor.precio_delta
      costo += valor.costo_delta ?? 0
    } else {
      // checkbox
      if (!seleccionadas.has(op.id)) continue
      if (op.multiplicado) {
        precio += op.precio_delta
        costo += op.costo_delta
      } else {
        // fijo independiente de cantidad — se prorratea al precio unitario
        precio += op.precio_delta / cant
        costo += op.costo_delta / cant
      }
    }
  }

  // Descuento por cantidad (aplica sobre precio base + opciones, antes de urgencia)
  if (config.descuentos_cantidad?.length) {
    const descuento = config.descuentos_cantidad
      .filter((d) => cant >= d.min_cantidad)
      .reduce((mayor, d) => (d.pct < mayor ? d.pct : mayor), 0)
    precio = precio * (1 + descuento)
  }

  // Urgencia
  if (params.urgencia && config.urgencia?.[params.urgencia]) {
    precio = precio * (1 + config.urgencia[params.urgencia].pct)
  }

  return _resultado(Math.round(precio * 100) / 100, Math.round(costo * 100) / 100, cant)
}

// ─── por_dimension ────────────────────────────────────────────────────────────

interface PorDimensionConfig {
  factor_a: number
  factor_b: number
  precio_minimo?: number
  costo_factor?: number
  urgencia?: Record<string, UrgenciaConfig>
}

interface PorDimensionParams {
  ancho: number
  alto: number
  cantidad: number
  urgencia?: string
}

export function calcularPorDimension(
  params: PorDimensionParams,
  config: PorDimensionConfig
): ResultadoCalculo {
  const area = params.ancho * params.alto
  let precio = Math.max(area * config.factor_a + config.factor_b, config.precio_minimo ?? 0)
  const costo = area * (config.costo_factor ?? 0)

  if (params.urgencia && config.urgencia?.[params.urgencia]) {
    precio = precio * (1 + config.urgencia[params.urgencia].pct)
  }

  return _resultado(Math.round(precio * 100) / 100, Math.round(costo * 100) / 100, params.cantidad)
}

// ─── tabla_tiered ─────────────────────────────────────────────────────────────

interface FilaTiered {
  material: string
  medida: string
  precio_menudeo: number
  precio_mayoreo: number
  factor_costo_cm2: number
  cm2?: number
}

interface TablaTieredConfig {
  umbral_mayoreo: number
  dimensiones: string[]
  filas: FilaTiered[]
}

interface TablaTieredParams {
  material: string
  medida: string
  cantidad: number
  totalPiezasCarrito?: number
}

export function calcularTiered(
  params: TablaTieredParams,
  config: TablaTieredConfig
): ResultadoCalculo {
  const fila = config.filas.find(
    (f) => f.material === params.material && f.medida === params.medida
  )
  if (!fila) return _resultado(0, 0, params.cantidad)

  const totalPiezas = (params.totalPiezasCarrito ?? 0) + params.cantidad
  const esMayoreo = totalPiezas >= config.umbral_mayoreo
  const precioUnit = esMayoreo ? fila.precio_mayoreo : fila.precio_menudeo
  const cm2 = fila.cm2 ?? 144
  const costoUnit = cm2 * fila.factor_costo_cm2

  return _resultado(precioUnit, Math.round(costoUnit * 100) / 100, params.cantidad)
}

// ─── por_hora ─────────────────────────────────────────────────────────────────

interface PorHoraParams {
  horas: number
  materiales: number
  extras: number
  margen_extra: number
  horaObjetivo: number
  horaLaser: number
}

export function calcularPorHora(params: PorHoraParams): ResultadoCalculo {
  const costoLaser = params.horas * params.horaLaser
  const costoTotal = costoLaser + params.materiales + params.extras
  const precioBase = params.horas * params.horaObjetivo + params.materiales + params.extras
  const precio = precioBase * (1 + params.margen_extra / 100)
  const iva = (precio / 1.16) * 0.16
  const ganancia = precio - costoTotal - iva

  return {
    total: Math.round(precio * 100) / 100,
    costo: Math.round(costoTotal * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    ganancia: Math.round(ganancia * 100) / 100,
    margen: precio > 0 ? Math.round(((ganancia / precio) * 100) * 100) / 100 : 0,
    precioUnit: Math.round(precio * 100) / 100,
  }
}

// ─── manual ───────────────────────────────────────────────────────────────────

interface ManualParams {
  precio: number
  costo: number
  cantidad: number
}

export function calcularManual(params: ManualParams): ResultadoCalculo {
  return _resultado(params.precio, params.costo, params.cantidad)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

export function totalesCarrito(items: { total: number; costo: number; iva: number }[]) {
  const total = r2(items.reduce((s, i) => s + i.total, 0))
  const costo = r2(items.reduce((s, i) => s + i.costo, 0))
  const iva = r2(items.reduce((s, i) => s + i.iva, 0))
  const ganancia = r2(total - costo - iva)
  const margen = total > 0 ? (ganancia / total) * 100 : 0
  return { total, costo, ganancia, margen: Math.round(margen * 100) / 100, iva }
}

/**
 * Recalcula total/iva/ganancia/margen de un ítem del carrito aplicando un
 * descuento manual sobre su precio unitario. Siempre parte de `precio_unit`
 * (nunca de un `total` ya descontado) para que ajustar el % no lo componga.
 */
export function aplicarDescuento(
  item: { precio_unit: number; cantidad: number; costo: number },
  descuentoPct: number
): Pick<ResultadoCalculo, "total" | "iva" | "ganancia" | "margen"> {
  const pct = Math.min(Math.max(descuentoPct, 0), 100)
  const total = r2(item.precio_unit * item.cantidad * (1 - pct / 100))
  const iva = r2((total / 1.16) * 0.16)
  const ganancia = r2(total - item.costo - iva)
  const margen = total > 0 ? Math.round((ganancia / total) * 10000) / 100 : 0
  return { total, iva, ganancia, margen }
}
