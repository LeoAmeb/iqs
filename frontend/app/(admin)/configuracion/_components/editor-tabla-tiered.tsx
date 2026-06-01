"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FilaTiered {
  material: string
  medida: string
  precio_menudeo: number
  precio_mayoreo: number
  factor_costo_cm2: number
  cm2: number
}

interface TablaTieredConfig {
  umbral_mayoreo: number
  dimensiones?: string[]
  filas?: FilaTiered[]
  [key: string]: unknown
}

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function EditorTablaTiered({ config: rawConfig, onChange }: Props) {
  const config = rawConfig as TablaTieredConfig
  const filas = (config.filas ?? []) as FilaTiered[]

  function updateFilas(next: FilaTiered[]) {
    onChange({ ...config, filas: next })
  }

  function updateFila(idx: number, partial: Partial<FilaTiered>) {
    const next = [...filas]
    next[idx] = { ...next[idx], ...partial }
    updateFilas(next)
  }

  function eliminarFila(idx: number) {
    updateFilas(filas.filter((_, i) => i !== idx))
  }

  function agregarFila() {
    const ultimo = filas[filas.length - 1]
    updateFilas([
      ...filas,
      {
        material: ultimo?.material ?? "",
        medida: "",
        precio_menudeo: 0,
        precio_mayoreo: 0,
        factor_costo_cm2: ultimo?.factor_costo_cm2 ?? 0.006,
        cm2: 100,
      },
    ])
  }

  return (
    <div className="space-y-5">
      {/* Umbral mayoreo */}
      <div className="space-y-1.5 max-w-xs">
        <Label className="text-xs">Umbral de mayoreo (piezas)</Label>
        <Input
          type="number" min={1}
          value={config.umbral_mayoreo ?? 20}
          onChange={(e) => onChange({ ...config, umbral_mayoreo: Number(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          A partir de este total de piezas en el carrito se aplica el precio de mayoreo.
        </p>
      </div>

      {/* Tabla */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tabla de precios ({filas.length} filas)
          </h4>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={agregarFila}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar fila
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          {/* Encabezados */}
          <div className="grid items-center bg-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5"
            style={{ gridTemplateColumns: "1fr 80px 80px 80px 90px 60px 28px" }}>
            <span>Material</span>
            <span>Medida</span>
            <span>Menudeo</span>
            <span>Mayoreo</span>
            <span>Costo/cm²</span>
            <span>cm²</span>
            <span />
          </div>

          {/* Filas */}
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {filas.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-8">
                Sin filas. Agrega con el botón de arriba.
              </p>
            )}
            {filas.map((fila, idx) => (
              <div
                key={idx}
                className="grid items-center px-3 py-1 hover:bg-muted/30"
                style={{ gridTemplateColumns: "1fr 80px 80px 80px 90px 60px 28px" }}
              >
                <Input
                  className="h-7 text-xs border-transparent focus-visible:border-border focus-visible:ring-0 px-1"
                  value={fila.material}
                  onChange={(e) => updateFila(idx, { material: e.target.value })}
                />
                <Input
                  className="h-7 text-xs border-transparent focus-visible:border-border focus-visible:ring-0 px-1"
                  value={fila.medida}
                  onChange={(e) => updateFila(idx, { medida: e.target.value })}
                />
                <Input
                  type="number" min={0}
                  className="h-7 text-xs border-transparent focus-visible:border-border focus-visible:ring-0 px-1"
                  value={fila.precio_menudeo}
                  onChange={(e) => updateFila(idx, { precio_menudeo: Number(e.target.value) })}
                />
                <Input
                  type="number" min={0}
                  className="h-7 text-xs border-transparent focus-visible:border-border focus-visible:ring-0 px-1"
                  value={fila.precio_mayoreo}
                  onChange={(e) => updateFila(idx, { precio_mayoreo: Number(e.target.value) })}
                />
                <Input
                  type="number" min={0} step={0.0001}
                  className="h-7 text-xs border-transparent focus-visible:border-border focus-visible:ring-0 px-1"
                  value={fila.factor_costo_cm2}
                  onChange={(e) => updateFila(idx, { factor_costo_cm2: Number(e.target.value) })}
                />
                <Input
                  type="number" min={1}
                  className="h-7 text-xs border-transparent focus-visible:border-border focus-visible:ring-0 px-1"
                  value={fila.cm2}
                  onChange={(e) => updateFila(idx, { cm2: Number(e.target.value) })}
                />
                <button
                  type="button" onClick={() => eliminarFila(idx)}
                  className="text-muted-foreground hover:text-destructive flex items-center justify-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
          <strong>Menudeo:</strong> precio con menos de {config.umbral_mayoreo ?? 20} pzas en el carrito.{" "}
          <strong>Mayoreo:</strong> precio al alcanzar el umbral.{" "}
          <strong>Costo/cm²:</strong> factor de costo de material (ej. 0.006 para MDF 3mm).{" "}
          <strong>cm²:</strong> área de la pieza, usada para calcular el costo.
        </p>
      </div>
    </div>
  )
}
