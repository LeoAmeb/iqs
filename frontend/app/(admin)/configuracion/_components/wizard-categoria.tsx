"use client"

import { useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useCreateCategoria, useUpdateCategoria, useRestablecerCategoria } from "@/hooks/use-productos"
import { EditorPrecioFijo } from "./editor-precio-fijo"
import { EditorTablaTiered } from "./editor-tabla-tiered"
import { EditorPorDimension } from "./editor-por-dimension"
import type { Categoria, CategoriaPayload, TipoCalculo } from "@/types"

// ── Opciones de tipo de cálculo ───────────────────────────────────────────────

const TIPOS: {
  value: TipoCalculo
  emoji: string
  label: string
  descripcion: string
  config_inicial: Record<string, unknown>
}[] = [
  {
    value: "precio_fijo",
    emoji: "🏷️",
    label: "Precio fijo + opciones",
    descripcion:
      "Precio base con opciones adicionales: tamaño, extras y urgencia. Ideal para logos, neones y displays.",
    config_inicial: {
      precio_base: 0,
      costo_base: 0,
      urgencia: { urgente: { pct: 0.20 } },
      permite_mismodia: false,
      opciones: [],
    },
  },
  {
    value: "por_dimension",
    emoji: "📐",
    label: "Por dimensión",
    descripcion:
      "El precio se calcula por el área (ancho × alto × factor). Ideal para cortes variables en acrílico o MDF.",
    config_inicial: {
      factor_a: 0.12,
      factor_b: 0,
      precio_minimo: 0,
      costo_factor: 0.04,
      urgencia: { urgente: { pct: 0.20 } },
    },
  },
  {
    value: "tabla_tiered",
    emoji: "📊",
    label: "Tabla de niveles (mayoreo)",
    descripcion:
      "Tabla de precios por material y medida, con precio especial al alcanzar cierta cantidad. Ideal para bases MDF.",
    config_inicial: {
      umbral_mayoreo: 20,
      filas: [],
    },
  },
  {
    value: "por_hora",
    emoji: "⏱️",
    label: "Por horas de trabajo",
    descripcion:
      "Cobra por tiempo + materiales. Usa la tarifa hora configurada en Parámetros globales.",
    config_inicial: {},
  },
  {
    value: "manual",
    emoji: "✏️",
    label: "Entrada manual",
    descripcion:
      "El vendedor ingresa precio y costo directamente al cotizar. Para casos especiales sin fórmula.",
    config_inicial: {},
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  categoria: Categoria | null
  onClose: () => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function WizardCategoria({ categoria, onClose }: Props) {
  const esNueva = categoria === null
  const crear = useCreateCategoria()
  const editar = useUpdateCategoria(categoria?.id ?? 0)
  const restablecer = useRestablecerCategoria(categoria?.id ?? 0)
  const [confirmarReset, setConfirmarReset] = useState(false)

  // En edición empezamos en el paso de config directamente
  const [paso, setPaso] = useState<1 | 2 | 3>(esNueva ? 1 : 3)
  const [nombre, setNombre] = useState(categoria?.nombre ?? "")
  const [icono, setIcono] = useState(categoria?.icono ?? "📦")
  const [orden, setOrden] = useState(categoria?.orden ?? 0)
  const [activo, setActivo] = useState(categoria?.activo ?? true)
  const [tipoCalculo, setTipoCalculo] = useState<TipoCalculo>(
    categoria?.tipo_calculo ?? "precio_fijo"
  )
  const [config, setConfig] = useState<Record<string, unknown>>(
    categoria?.config ?? TIPOS[0].config_inicial
  )
  const [guardando, setGuardando] = useState(false)

  const tipoSeleccionado = TIPOS.find((t) => t.value === tipoCalculo)!

  function seleccionarTipo(tipo: TipoCalculo) {
    setTipoCalculo(tipo)
    // Solo resetear config al cambiar tipo en modo creación
    if (esNueva) {
      setConfig(TIPOS.find((t) => t.value === tipo)!.config_inicial)
    }
  }

  async function guardar() {
    if (!nombre.trim()) return
    setGuardando(true)
    try {
      const payload: CategoriaPayload = {
        nombre: nombre.trim(),
        icono,
        orden,
        activo,
        tipo_calculo: tipoCalculo,
        config,
      }
      if (esNueva) {
        await crear.mutateAsync(payload)
      } else {
        await editar.mutateAsync(payload)
      }
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const PASOS = ["Básico", "Tipo", "Configuración"]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {esNueva ? "Nueva categoría" : `Editar — ${categoria.nombre}`}
          </DialogTitle>
        </DialogHeader>

        {/* Stepper (solo en creación) */}
        {esNueva && (
          <div className="flex items-center gap-1 pb-3 border-b shrink-0">
            {PASOS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3
              const esCurrent = paso === n
              const completado = paso > n
              return (
                <div key={n} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                      esCurrent && "bg-foreground text-background",
                      completado && "bg-emerald-500 text-white",
                      !esCurrent && !completado && "bg-muted text-muted-foreground"
                    )}
                  >
                    {completado ? <Check className="h-3 w-3" /> : n}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      esCurrent ? "font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                  {i < PASOS.length - 1 && (
                    <div className="h-px w-5 bg-border mx-1" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* ── Paso 1: Datos básicos ── */}
          {paso === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  autoFocus
                  placeholder="ej. Logos, Neones, Toppers..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && nombre.trim()) setPaso(2)
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Icono (emoji)</Label>
                  <Input
                    placeholder="📦"
                    maxLength={4}
                    value={icono}
                    onChange={(e) => setIcono(e.target.value)}
                    className="text-2xl text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Orden de aparición</Label>
                  <Input
                    type="number" min={0} step={10}
                    value={orden}
                    onChange={(e) => setOrden(Number(e.target.value))}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Menor número = aparece antes
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Visible en cotizador</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={activo} onCheckedChange={setActivo} />
                    <span className="text-sm">{activo ? "Activa" : "Inactiva"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Paso 2: Tipo de cálculo ── */}
          {paso === 2 && (
            <div className="space-y-2 py-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => seleccionarTipo(t.value)}
                  className={cn(
                    "w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                    tipoCalculo === t.value
                      ? "border-foreground bg-foreground/5"
                      : "hover:bg-muted hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-2xl mt-0.5 shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {t.descripcion}
                    </p>
                  </div>
                  {tipoCalculo === t.value && (
                    <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-background" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Paso 3: Configuración ── */}
          {paso === 3 && (
            <div className="py-2">
              {/* Cabecera de datos básicos en modo edición */}
              {!esNueva && (
                <div className="rounded-lg border bg-muted/30 px-4 py-3 mb-4 space-y-3">
                  <div className="grid grid-cols-[1fr_80px_80px_auto] gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Icono</Label>
                      <Input
                        maxLength={4} value={icono}
                        onChange={(e) => setIcono(e.target.value)}
                        className="h-8 text-xl text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Orden</Label>
                      <Input
                        type="number" min={0} step={10} value={orden}
                        onChange={(e) => setOrden(Number(e.target.value))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Activa</Label>
                      <div className="flex items-center gap-2 h-8">
                        <Switch checked={activo} onCheckedChange={setActivo} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-base">{tipoSeleccionado.emoji}</span>
                    <span className="font-medium text-foreground">{tipoSeleccionado.label}</span>
                    <span>· tipo de cálculo</span>
                  </div>
                </div>
              )}

              {tipoCalculo === "precio_fijo" && (
                <EditorPrecioFijo config={config} onChange={setConfig} />
              )}
              {tipoCalculo === "por_dimension" && (
                <EditorPorDimension config={config} onChange={setConfig} />
              )}
              {tipoCalculo === "tabla_tiered" && (
                <EditorTablaTiered config={config} onChange={setConfig} />
              )}
              {tipoCalculo === "por_hora" && (
                <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-2">
                  <p className="text-3xl">⏱️</p>
                  <p className="font-medium">Sin configuración adicional</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Esta categoría usa la <strong>tarifa por hora</strong> configurada en{" "}
                    <em>Parámetros globales</em> (hora objetivo y hora láser).
                  </p>
                </div>
              )}
              {tipoCalculo === "manual" && (
                <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-2">
                  <p className="text-3xl">✏️</p>
                  <p className="font-medium">Sin configuración</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    El vendedor ingresa precio y costo directamente al cotizar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie con acciones */}
        <div className="flex items-center justify-between pt-4 border-t shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={
                esNueva && paso > 1
                  ? () => setPaso((p) => (p - 1) as 1 | 2 | 3)
                  : onClose
              }
            >
              {esNueva && paso > 1 ? "← Atrás" : "Cancelar"}
            </Button>

            {/* Botón restablecer — solo en edición en el paso de config */}
            {!esNueva && paso === 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setConfirmarReset(true)}
                disabled={restablecer.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restablecer base
              </Button>
            )}
          </div>

          {esNueva && paso < 3 ? (
            <Button
              type="button"
              onClick={() => setPaso((p) => (p + 1) as 1 | 2 | 3)}
              disabled={paso === 1 && !nombre.trim()}
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              type="button"
              onClick={guardar}
              disabled={guardando || !nombre.trim()}
            >
              {guardando
                ? "Guardando..."
                : esNueva
                  ? "Crear categoría"
                  : "Guardar cambios"}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Confirmación de reset */}
      {confirmarReset && (
        <Dialog open onOpenChange={() => setConfirmarReset(false)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Restablecer configuración base?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              La configuración de <strong>{categoria?.nombre}</strong> volverá a los
              valores originales del negocio. Los cambios locales no guardados se perderán.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmarReset(false)}>
                Cancelar
              </Button>
              <Button
                disabled={restablecer.isPending}
                onClick={async () => {
                  const data = await restablecer.mutateAsync()
                  setConfig(data.config)
                  setTipoCalculo(data.tipo_calculo)
                  setConfirmarReset(false)
                }}
              >
                {restablecer.isPending ? "Restableciendo..." : "Restablecer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
