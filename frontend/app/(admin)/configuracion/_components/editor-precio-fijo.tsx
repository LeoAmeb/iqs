"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// ── Tipos internos ────────────────────────────────────────────────────────────

interface ValorDef {
  id: string
  label: string
  precio_delta: number
  costo_delta: number
}

interface OpcionCheckbox {
  id: string
  tipo?: undefined
  grupo?: "extras"
  label: string
  precio_delta: number
  costo_delta: number
  multiplicado: boolean
}

interface OpcionSelect {
  id: string
  tipo: "select"
  grupo?: "extras"
  label: string
  valores: ValorDef[]
}

interface OpcionNumber {
  id: string
  tipo: "number"
  grupo?: "extras"
  label: string
  precio_por_unidad: number
  costo_por_unidad: number
}

type OpcionDef = OpcionCheckbox | OpcionSelect | OpcionNumber

interface DescuentoCantidad {
  min_cantidad: number
  pct: number
}

interface PrecioFijoConfig {
  precio_base: number
  costo_base: number
  permite_mismodia?: boolean
  urgencia?: Record<string, { pct: number }>
  opciones?: OpcionDef[]
  descuentos_cantidad?: DescuentoCantidad[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EditorPrecioFijo({ config: rawConfig, onChange }: Props) {
  const config = rawConfig as unknown as PrecioFijoConfig
  const [expandida, setExpandida] = useState<string | null>(null)
  const [nuevaOpcion, setNuevaOpcion] = useState<{
    label: string
    tipo: "checkbox" | "select" | "number"
    grupo: "principal" | "extras"
    precio_delta: number
    costo_delta: number
  } | null>(null)

  function update(partial: Partial<PrecioFijoConfig>) {
    onChange({ ...config, ...partial })
  }

  const opciones = config.opciones ?? []

  function updateOpcion(idx: number, partial: Partial<OpcionDef>) {
    const next = [...opciones]
    next[idx] = { ...next[idx], ...partial } as OpcionDef
    update({ opciones: next })
  }

  function eliminarOpcion(idx: number) {
    update({ opciones: opciones.filter((_, i) => i !== idx) })
  }

  function agregarOpcion() {
    if (!nuevaOpcion?.label.trim()) return
    const id = toSlug(nuevaOpcion.label)
    let op: OpcionDef
    const grupoFinal = nuevaOpcion.grupo === "extras" ? ("extras" as const) : undefined
    if (nuevaOpcion.tipo === "select") {
      op = { id, tipo: "select", label: nuevaOpcion.label.trim(), valores: [], grupo: grupoFinal }
    } else if (nuevaOpcion.tipo === "number") {
      op = { id, tipo: "number", label: nuevaOpcion.label.trim(), precio_por_unidad: 0, costo_por_unidad: 0, grupo: grupoFinal }
    } else {
      op = {
        id,
        label: nuevaOpcion.label.trim(),
        precio_delta: nuevaOpcion.precio_delta,
        costo_delta: nuevaOpcion.costo_delta,
        multiplicado: false,
        grupo: grupoFinal,
      }
    }
    update({ opciones: [...opciones, op] })
    setNuevaOpcion(null)
  }

  function agregarValor(idxOp: number) {
    const next = [...opciones]
    const op = { ...(next[idxOp] as OpcionSelect) }
    op.valores = [...(op.valores ?? []), { id: "", label: "", precio_delta: 0, costo_delta: 0 }]
    next[idxOp] = op
    update({ opciones: next })
  }

  function updateValor(idxOp: number, idxVal: number, partial: Partial<ValorDef>) {
    const next = [...opciones]
    const op = { ...(next[idxOp] as OpcionSelect) }
    const vals = [...op.valores]
    vals[idxVal] = { ...vals[idxVal], ...partial }
    if (partial.label) vals[idxVal].id = toSlug(partial.label)
    op.valores = vals
    next[idxOp] = op
    update({ opciones: next })
  }

  function eliminarValor(idxOp: number, idxVal: number) {
    const next = [...opciones]
    const op = { ...(next[idxOp] as OpcionSelect) }
    op.valores = op.valores.filter((_, i) => i !== idxVal)
    next[idxOp] = op
    update({ opciones: next })
  }

  function addDescuento() {
    update({ descuentos_cantidad: [...(config.descuentos_cantidad ?? []), { min_cantidad: 5, pct: -0.10 }] })
  }

  function removeDescuento(idx: number) {
    update({ descuentos_cantidad: (config.descuentos_cantidad ?? []).filter((_, i) => i !== idx) })
  }

  function updateDescuento(idx: number, partial: Partial<DescuentoCantidad>) {
    const next = [...(config.descuentos_cantidad ?? [])]
    next[idx] = { ...next[idx], ...partial }
    update({ descuentos_cantidad: next })
  }

  const tipoLabel = (tipo?: string) =>
    tipo === "select" ? "Selección" : tipo === "number" ? "Número" : "Checkbox"

  const tipoColor = (tipo?: string) =>
    tipo === "select"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      : tipo === "number"
        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"

  return (
    <div className="space-y-6">
      {/* Precios base */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Precios base
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Precio base ($)</Label>
            <Input
              type="number" min={0} step={10}
              value={config.precio_base ?? 0}
              onChange={(e) => update({ precio_base: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Costo base ($)</Label>
            <Input
              type="number" min={0} step={10}
              value={config.costo_base ?? 0}
              onChange={(e) => update({ costo_base: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Urgencia */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Urgencias
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border px-4 py-2.5">
            <div>
              <p className="text-sm font-medium">Urgente</p>
              <p className="text-xs text-muted-foreground">Recargo proporcional al precio</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={0} max={2} step={0.05}
                className="w-20 h-8 text-sm"
                value={config.urgencia?.urgente?.pct ?? 0}
                onChange={(e) =>
                  update({ urgencia: { ...config.urgencia, urgente: { pct: Number(e.target.value) } } })
                }
              />
              <span className="text-xs text-muted-foreground w-14">×precio</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Mismo día</p>
                <Switch
                  checked={config.permite_mismodia ?? false}
                  onCheckedChange={(v) => update({ permite_mismodia: v })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Activar si se ofrece entrega el mismo día</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={0} max={2} step={0.05}
                className="w-20 h-8 text-sm"
                disabled={!config.permite_mismodia}
                value={config.urgencia?.mismodia?.pct ?? 0}
                onChange={(e) =>
                  update({ urgencia: { ...config.urgencia, mismodia: { pct: Number(e.target.value) } } })
                }
              />
              <span className="text-xs text-muted-foreground w-14">×precio</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Descuentos por cantidad */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Descuentos por volumen
          </h4>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addDescuento}>
            <Plus className="h-3 w-3 mr-1" /> Agregar
          </Button>
        </div>
        {(config.descuentos_cantidad ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin descuentos configurados.</p>
        ) : (
          <div className="space-y-2">
            {(config.descuentos_cantidad ?? []).map((d, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Desde</Label>
                  <Input
                    type="number" min={1} className="w-20 h-7 text-xs"
                    value={d.min_cantidad}
                    onChange={(e) => updateDescuento(idx, { min_cantidad: Number(e.target.value) })}
                  />
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">piezas →</Label>
                  <Input
                    type="number" step={0.01} className="w-20 h-7 text-xs"
                    value={d.pct}
                    onChange={(e) => updateDescuento(idx, { pct: Number(e.target.value) })}
                  />
                  <span className="text-xs text-muted-foreground">(ej. −0.10 = −10%)</span>
                </div>
                <button
                  type="button" onClick={() => removeDescuento(idx)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Opciones del formulario */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Opciones del formulario
          </h4>
          <Button
            type="button" variant="outline" size="sm" className="h-7 text-xs"
            onClick={() =>
              setNuevaOpcion({ label: "", tipo: "checkbox", grupo: "principal", precio_delta: 0, costo_delta: 0 })
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva opción
          </Button>
        </div>

        <div className="space-y-1.5">
          {opciones.length === 0 && !nuevaOpcion && (
            <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
              Sin opciones configuradas.
            </p>
          )}

          {opciones.map((op, idx) => (
            <div key={op.id} className="rounded-lg border overflow-hidden">
              {/* Fila resumen */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 select-none"
                onClick={() => setExpandida(expandida === op.id ? null : op.id)}
              >
                {expandida === op.id
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${tipoColor(op.tipo)}`}>
                  {tipoLabel(op.tipo)}
                </span>
                <span className="text-sm flex-1 font-medium leading-tight">
                  {op.label || <span className="text-muted-foreground italic">sin nombre</span>}
                </span>
                {op.grupo === "extras" && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded shrink-0">
                    Extras
                  </span>
                )}
                {"precio_delta" in op && (op as OpcionCheckbox).precio_delta > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    +${(op as OpcionCheckbox).precio_delta}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); eliminarOpcion(idx) }}
                  className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Editor expandido */}
              {expandida === op.id && (
                <div className="border-t bg-muted/20 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Etiqueta</Label>
                      <Input
                        className="h-8 text-sm" value={op.label}
                        onChange={(e) => updateOpcion(idx, { label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Sección en el formulario</Label>
                      <Select
                        value={op.grupo ?? "principal"}
                        onValueChange={(v) =>
                          updateOpcion(idx, { grupo: v === "extras" ? "extras" : undefined } as Partial<OpcionDef>)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal">Principal (arriba)</SelectItem>
                          <SelectItem value="extras">Extras (píldoras)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Checkbox */}
                  {!op.tipo && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Precio delta ($)</Label>
                        <Input
                          type="number" min={0} className="h-8 text-sm"
                          value={(op as OpcionCheckbox).precio_delta ?? 0}
                          onChange={(e) => updateOpcion(idx, { precio_delta: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Costo delta ($)</Label>
                        <Input
                          type="number" min={0} className="h-8 text-sm"
                          value={(op as OpcionCheckbox).costo_delta ?? 0}
                          onChange={(e) => updateOpcion(idx, { costo_delta: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Multiplicar ×cantidad</Label>
                        <div className="flex items-center gap-2 h-8">
                          <Switch
                            checked={(op as OpcionCheckbox).multiplicado ?? false}
                            onCheckedChange={(v) => updateOpcion(idx, { multiplicado: v })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Number */}
                  {op.tipo === "number" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Precio por unidad ($)</Label>
                        <Input
                          type="number" min={0} className="h-8 text-sm"
                          value={(op as OpcionNumber).precio_por_unidad ?? 0}
                          onChange={(e) => updateOpcion(idx, { precio_por_unidad: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Costo por unidad ($)</Label>
                        <Input
                          type="number" min={0} className="h-8 text-sm"
                          value={(op as OpcionNumber).costo_por_unidad ?? 0}
                          onChange={(e) => updateOpcion(idx, { costo_por_unidad: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Select values */}
                  {op.tipo === "select" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Valores de la lista</Label>
                        <Button
                          type="button" variant="ghost" size="sm" className="h-6 text-xs"
                          onClick={() => agregarValor(idx)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Agregar valor
                        </Button>
                      </div>
                      {((op as OpcionSelect).valores ?? []).length === 0 && (
                        <p className="text-xs text-muted-foreground">Sin valores. Agrega el primero.</p>
                      )}
                      {((op as OpcionSelect).valores ?? []).map((val, vidx) => (
                        <div key={vidx} className="grid grid-cols-[1fr_72px_72px_20px] gap-2 items-end">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Etiqueta</Label>
                            <Input
                              className="h-7 text-xs mt-0.5" value={val.label}
                              onChange={(e) =>
                                updateValor(idx, vidx, { label: e.target.value, id: toSlug(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">+Precio</Label>
                            <Input
                              type="number" min={0} className="h-7 text-xs mt-0.5"
                              value={val.precio_delta}
                              onChange={(e) => updateValor(idx, vidx, { precio_delta: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">+Costo</Label>
                            <Input
                              type="number" min={0} className="h-7 text-xs mt-0.5"
                              value={val.costo_delta ?? 0}
                              onChange={(e) => updateValor(idx, vidx, { costo_delta: Number(e.target.value) })}
                            />
                          </div>
                          <button
                            type="button" onClick={() => eliminarValor(idx, vidx)}
                            className="text-muted-foreground hover:text-destructive pb-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form nueva opción */}
        {nuevaOpcion && (
          <div className="mt-2 rounded-lg border-2 border-dashed p-3 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Nueva opción
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={nuevaOpcion.tipo}
                  onValueChange={(v) =>
                    setNuevaOpcion((p) => p ? { ...p, tipo: v as "checkbox" | "select" | "number" } : p)
                  }
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkbox">Checkbox (sí/no)</SelectItem>
                    <SelectItem value="select">Selección de lista</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Etiqueta *</Label>
                <Input
                  autoFocus className="h-8 text-sm"
                  placeholder="ej. Instalación +$300"
                  value={nuevaOpcion.label}
                  onChange={(e) => setNuevaOpcion((p) => p ? { ...p, label: e.target.value } : p)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sección</Label>
                <Select
                  value={nuevaOpcion.grupo}
                  onValueChange={(v) =>
                    setNuevaOpcion((p) => p ? { ...p, grupo: v as "principal" | "extras" } : p)
                  }
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="extras">Extras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {nuevaOpcion.tipo === "checkbox" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Precio delta ($)</Label>
                    <Input
                      type="number" min={0} className="h-8 text-sm"
                      value={nuevaOpcion.precio_delta}
                      onChange={(e) =>
                        setNuevaOpcion((p) => p ? { ...p, precio_delta: Number(e.target.value) } : p)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Costo delta ($)</Label>
                    <Input
                      type="number" min={0} className="h-8 text-sm"
                      value={nuevaOpcion.costo_delta}
                      onChange={(e) =>
                        setNuevaOpcion((p) => p ? { ...p, costo_delta: Number(e.target.value) } : p)
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setNuevaOpcion(null)}>
                Cancelar
              </Button>
              <Button
                type="button" size="sm"
                onClick={agregarOpcion}
                disabled={!nuevaOpcion.label.trim()}
              >
                Agregar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
