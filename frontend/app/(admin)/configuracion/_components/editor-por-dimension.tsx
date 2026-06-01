"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface PorDimensionConfig {
  factor_a: number
  factor_b: number
  precio_minimo?: number
  costo_factor?: number
  urgencia?: Record<string, { pct: number }>
  [key: string]: unknown
}

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function EditorPorDimension({ config: rawConfig, onChange }: Props) {
  const config = rawConfig as PorDimensionConfig

  function update(partial: Partial<PorDimensionConfig>) {
    onChange({ ...config, ...partial })
  }

  return (
    <div className="space-y-6">
      {/* Fórmula */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Fórmula de precio
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Precio = max(<strong>ancho × alto × Factor A</strong> + <strong>Factor B</strong>, <strong>Precio mínimo</strong>)
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Factor A ($ por cm²)</Label>
            <Input
              type="number" min={0} step={0.001}
              value={config.factor_a ?? 0}
              onChange={(e) => update({ factor_a: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Factor B ($ fijo)</Label>
            <Input
              type="number" min={0} step={1}
              value={config.factor_b ?? 0}
              onChange={(e) => update({ factor_b: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Precio mínimo ($)</Label>
            <Input
              type="number" min={0} step={10}
              value={config.precio_minimo ?? 0}
              onChange={(e) => update({ precio_minimo: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="mt-3 max-w-[200px] space-y-1.5">
          <Label className="text-xs">Costo por cm²</Label>
          <Input
            type="number" min={0} step={0.001}
            value={config.costo_factor ?? 0}
            onChange={(e) => update({ costo_factor: Number(e.target.value) })}
          />
        </div>
      </div>

      <Separator />

      {/* Urgencias */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Urgencias (×precio)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Urgente</Label>
            <Input
              type="number" min={0} max={2} step={0.05}
              value={config.urgencia?.urgente?.pct ?? 0}
              onChange={(e) =>
                update({ urgencia: { ...config.urgencia, urgente: { pct: Number(e.target.value) } } })
              }
            />
            <p className="text-[10px] text-muted-foreground">ej. 0.20 = +20%</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mismo día</Label>
            <Input
              type="number" min={0} max={2} step={0.05}
              value={config.urgencia?.mismodia?.pct ?? 0}
              onChange={(e) =>
                update({ urgencia: { ...config.urgencia, mismodia: { pct: Number(e.target.value) } } })
              }
            />
            <p className="text-[10px] text-muted-foreground">ej. 0.50 = +50%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
