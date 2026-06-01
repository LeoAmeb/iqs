"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  calcularPrecioFijo,
  calcularPorDimension,
  calcularTiered,
  calcularPorHora,
  calcularManual,
  formatMXN,
} from "@/lib/cotizador/calculos"
import type { Categoria, CarritoItem, ConfiguracionSistema } from "@/types"

export interface FormularioDefaultValues {
  cantidad?: number
  urgencia?: string
  ancho?: number
  alto?: number
  material?: string
  medida?: string
  horas?: number
  materiales?: number
  extras?: number
  margenExtra?: number
  precioManual?: number
  costoManual?: number
  descripcion?: string
  opciones_seleccionadas?: string[]
  opciones_select?: Record<string, string>
  opciones_number?: Record<string, number>
}

interface Props {
  categoria: Categoria
  config: ConfiguracionSistema
  carritoTiered: CarritoItem[]
  onAgregar: (item: Omit<CarritoItem, "_id">) => void
  defaultValues?: FormularioDefaultValues
  mode?: "agregar" | "editar"
}

interface OpcionDef {
  id: string
  tipo?: string
  grupo?: string
  label: string
  precio_delta?: number
  costo_delta?: number
  multiplicado?: boolean
  valores?: Array<{ id: string; label: string; precio_delta: number; costo_delta?: number }>
  precio_por_unidad?: number
  costo_por_unidad?: number
}

export function FormularioProducto({ categoria, config, carritoTiered, onAgregar, defaultValues, mode = "agregar" }: Props) {
  const dv = defaultValues ?? {}
  const [cantidad, setCantidad] = useState(dv.cantidad ?? 1)
  const [urgencia, setUrgencia] = useState(dv.urgencia ?? "")
  const [ancho, setAncho] = useState(dv.ancho ?? 30)
  const [alto, setAlto] = useState(dv.alto ?? 30)
  const [material, setMaterial] = useState(dv.material ?? "")
  const [medida, setMedida] = useState(dv.medida ?? "")
  const [horas, setHoras] = useState(dv.horas ?? 1)
  const [materiales, setMateriales] = useState(dv.materiales ?? 0)
  const [extras, setExtras] = useState(dv.extras ?? 0)
  const [margenExtra, setMargenExtra] = useState(dv.margenExtra ?? 0)
  const [precioManual, setPrecioManual] = useState(dv.precioManual ?? 0)
  const [costoManual, setCostoManual] = useState(dv.costoManual ?? 0)
  const [descripcion, setDescripcion] = useState(dv.descripcion ?? "")

  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<Set<string>>(
    new Set(dv.opciones_seleccionadas ?? [])
  )
  const [opcionesSelect, setOpcionesSelect] = useState<Record<string, string>>(dv.opciones_select ?? {})
  const [opcionesNumber, setOpcionesNumber] = useState<Record<string, number>>(dv.opciones_number ?? {})

  const cfg = categoria.config as Record<string, unknown>
  const todasOpciones = (cfg.opciones as OpcionDef[] | undefined) ?? []
  const permiteMismodia = cfg.permite_mismodia === true

  // Separa las opciones en sección principal y sección extras
  const opcionesPrincipales = todasOpciones.filter((op) => op.grupo !== "extras")
  const opcionesExtras = todasOpciones.filter((op) => op.grupo === "extras")

  function toggleOpcion(id: string) {
    setOpcionesSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function calcular() {
    switch (categoria.tipo_calculo) {
      case "precio_fijo":
        return calcularPrecioFijo(
          {
            cantidad,
            urgencia,
            opciones_seleccionadas: [...opcionesSeleccionadas],
            opciones_select: opcionesSelect,
            opciones_number: opcionesNumber,
          },
          cfg as unknown as Parameters<typeof calcularPrecioFijo>[1]
        )
      case "por_dimension":
        return calcularPorDimension(
          { ancho, alto, cantidad, urgencia },
          cfg as unknown as Parameters<typeof calcularPorDimension>[1]
        )
      case "tabla_tiered": {
        const totalPiezasCarrito = carritoTiered.reduce((s, i) => s + i.cantidad, 0)
        return calcularTiered(
          { material, medida, cantidad, totalPiezasCarrito },
          cfg as unknown as Parameters<typeof calcularTiered>[1]
        )
      }
      case "por_hora":
        return calcularPorHora({
          horas,
          materiales,
          extras,
          margen_extra: margenExtra,
          horaObjetivo: Number(config.hora_objetivo),
          horaLaser: Number(config.hora_laser),
        })
      case "manual":
        return calcularManual({ precio: precioManual, costo: costoManual, cantidad })
      default:
        return null
    }
  }

  const resultado = calcular()

  function handleAgregar() {
    if (!resultado) return
    onAgregar({
      categoria_id: categoria.id,
      nombre_producto: categoria.nombre,
      tipo_calculo: categoria.tipo_calculo,
      descripcion: descripcion || categoria.nombre,
      cantidad,
      precio_unit: resultado.precioUnit,
      total: resultado.total,
      iva_pct: 16,
      iva: resultado.iva,
      costo: resultado.costo,
      ganancia: resultado.ganancia,
      margen: resultado.margen,
      detalles: {
        inputs: {
          ancho, alto, material, medida, horas, materiales, extras, margenExtra, urgencia,
          opciones_seleccionadas: [...opcionesSeleccionadas],
          opciones_select: opcionesSelect,
          opciones_number: opcionesNumber,
        },
        config_snapshot: categoria.config,
      },
    })
  }

  const urgencias = cfg.urgencia
    ? Object.keys(cfg.urgencia as Record<string, unknown>).filter(
        (u) => u !== "mismodia" || permiteMismodia
      )
    : []
  const filas = (cfg.filas as Array<{ material: string; medida: string }> | undefined) ?? []
  const materiales_disponibles = [...new Set(filas.map((f) => f.material))]
  const medidas_disponibles = filas.filter((f) => f.material === material).map((f) => f.medida)

  const margenColor = resultado
    ? resultado.margen >= 50
      ? "text-green-600"
      : resultado.margen >= 25
        ? "text-amber-600"
        : "text-red-600"
    : ""
  const margenBg = resultado
    ? resultado.margen >= 50
      ? "bg-green-500"
      : resultado.margen >= 25
        ? "bg-amber-500"
        : "bg-red-500"
    : "bg-gray-300"

  // ── Renderizador de una opción principal (select, number o checkbox) ──────
  function renderOpcionPrincipal(op: OpcionDef) {
    if (op.tipo === "select" && op.valores) {
      return (
        <div key={op.id} className="space-y-1">
          <Label className="text-xs">{op.label}</Label>
          <Select
            value={opcionesSelect[op.id] || ""}
            onValueChange={(v) => setOpcionesSelect((prev) => ({ ...prev, [op.id]: v }))}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {op.valores.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (op.tipo === "number") {
      return (
        <div key={op.id} className="space-y-1">
          <Label className="text-xs">{op.label}</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={opcionesNumber[op.id] ?? 0}
            onChange={(e) => setOpcionesNumber((prev) => ({ ...prev, [op.id]: Number(e.target.value) }))}
            className="h-8 text-sm"
          />
        </div>
      )
    }

    // Checkbox principal — ancho completo
    const activo = opcionesSeleccionadas.has(op.id)
    return (
      <button
        key={op.id}
        type="button"
        onClick={() => toggleOpcion(op.id)}
        className={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors ${
          activo
            ? "bg-foreground text-background border-foreground"
            : "bg-background text-foreground border-border hover:bg-muted"
        }`}
      >
        {op.label}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {/* Descripción */}
      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder={categoria.nombre}
          className="h-8 text-sm"
        />
      </div>

      {/* Cantidad */}
      {categoria.tipo_calculo !== "por_hora" && (
        <div className="space-y-1">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            min={1}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Opciones principales (selects + numbers + checkboxes sin grupo) */}
      {opcionesPrincipales.length > 0 && (
        <div className="space-y-2">
          {opcionesPrincipales.map(renderOpcionPrincipal)}
        </div>
      )}

      {/* Dimensión */}
      {categoria.tipo_calculo === "por_dimension" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Ancho (cm)</Label>
            <Input type="number" min={1} value={ancho} onChange={(e) => setAncho(Number(e.target.value))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alto (cm)</Label>
            <Input type="number" min={1} value={alto} onChange={(e) => setAlto(Number(e.target.value))} className="h-8 text-sm" />
          </div>
        </div>
      )}

      {/* Tabla tiered */}
      {categoria.tipo_calculo === "tabla_tiered" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {materiales_disponibles.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Medida</Label>
            <Select value={medida} onValueChange={setMedida}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {medidas_disponibles.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Por hora */}
      {categoria.tipo_calculo === "por_hora" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Horas</Label>
            <Input type="number" min={0.5} step={0.5} value={horas} onChange={(e) => setHoras(Number(e.target.value))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Materiales ($)</Label>
            <Input type="number" min={0} value={materiales} onChange={(e) => setMateriales(Number(e.target.value))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Extras ($)</Label>
            <Input type="number" min={0} value={extras} onChange={(e) => setExtras(Number(e.target.value))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Margen extra (%)</Label>
            <Input type="number" min={0} value={margenExtra} onChange={(e) => setMargenExtra(Number(e.target.value))} className="h-8 text-sm" />
          </div>
        </div>
      )}

      {/* Manual */}
      {categoria.tipo_calculo === "manual" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Precio ($)</Label>
            <Input type="number" min={0} value={precioManual} onChange={(e) => setPrecioManual(Number(e.target.value))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Costo ($)</Label>
            <Input type="number" min={0} value={costoManual} onChange={(e) => setCostoManual(Number(e.target.value))} className="h-8 text-sm" />
          </div>
        </div>
      )}

      {/* Sección Extras — toggle buttons compactos en flex-wrap */}
      {opcionesExtras.length > 0 && (
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Extras
          </p>
          <div className="flex flex-wrap gap-2">
            {opcionesExtras.map((op) => {
              const activo = opcionesSeleccionadas.has(op.id)
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => toggleOpcion(op.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    activo
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {op.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Urgencia */}
      {urgencias.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Urgencia</Label>
          <Select value={urgencia || "normal"} onValueChange={(v) => setUrgencia(v === "normal" ? "" : v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Normal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              {urgencias.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Desglose */}
      {resultado && (
        <div className="rounded-lg border bg-background p-3 space-y-1 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Desglose</p>
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal sin IVA</span>
            <span>{formatMXN(resultado.total - resultado.iva)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>IVA 16% absorbido</span>
            <span className="text-red-500">−{formatMXN(resultado.iva)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2 mt-1 text-sm">
            <span>Total</span>
            <span>{formatMXN(resultado.total)}</span>
          </div>
          <div className="mt-2 pt-2 border-t space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margen real</span>
              <span className={`font-semibold ${margenColor}`}>{resultado.margen.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${margenBg}`}
                style={{ width: `${Math.min(Math.max(resultado.margen, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Precio unit: {formatMXN(resultado.precioUnit)}</span>
              <span className={margenColor}>Ganancia: {formatMXN(resultado.ganancia)}</span>
            </div>
          </div>
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={handleAgregar}
        disabled={!resultado || resultado.total === 0}
      >
        {mode === "editar" ? "Guardar cambios" : "Agregar al carrito"}
      </Button>
    </div>
  )
}
