"use client"

import { useProduccion, useActualizarEstatusProduccion } from "@/hooks/use-produccion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMXN } from "@/lib/cotizador/calculos"
import type { EstatusProduccion, ProduccionItem } from "@/types"
import { ChevronRight } from "lucide-react"

const COLUMNAS: { key: EstatusProduccion; label: string; siguiente: EstatusProduccion | null }[] = [
  { key: "pendiente", label: "Pendiente", siguiente: "en_produccion" },
  { key: "en_produccion", label: "En Producción", siguiente: "listo" },
  { key: "listo", label: "Listo", siguiente: "entregado" },
  { key: "entregado", label: "Entregado", siguiente: null },
]

function KanbanCard({ item, onAvanzar }: { item: ProduccionItem; onAvanzar?: () => void }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const vencido = item.fecha_entrega && item.fecha_entrega < hoy

  return (
    <Card className="shadow-sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <p className="font-medium text-sm leading-tight">{item.nombre_producto}</p>
          <span className="font-mono text-xs text-muted-foreground shrink-0">#{item.folio_pedido.toString().padStart(4, "0")}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.descripcion || `×${item.cantidad}`}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">{formatMXN(Number(item.total))}</span>
          {item.fecha_entrega && (
            <span className={`text-xs ${vencido ? "text-destructive font-bold" : "text-muted-foreground"}`}>
              {item.fecha_entrega}
            </span>
          )}
        </div>
        {item.nombre_cliente && (
          <p className="text-xs text-muted-foreground">{item.nombre_cliente}</p>
        )}
        {onAvanzar && (
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={onAvanzar}>
            Avanzar <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function KanbanColumna({
  columna,
  items,
}: {
  columna: typeof COLUMNAS[number]
  items: ProduccionItem[]
}) {
  return (
    <div className="flex-1 min-w-[200px] space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-sm">{columna.label}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <KanbanItemWrapper key={item.id} item={item} siguiente={columna.siguiente} />
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground">
            Sin ítems
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanItemWrapper({
  item,
  siguiente,
}: {
  item: ProduccionItem
  siguiente: EstatusProduccion | null
}) {
  const actualizar = useActualizarEstatusProduccion(item.id)

  return (
    <KanbanCard
      item={item}
      onAvanzar={
        siguiente
          ? () => actualizar.mutate({ estatus_produccion: siguiente })
          : undefined
      }
    />
  )
}

export default function ProduccionPage() {
  const { data, isLoading } = useProduccion()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 space-y-3">
              <Skeleton className="h-6 w-24" />
              {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-28 w-full" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const items = data?.results ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Producción</h1>
        <p className="text-muted-foreground">Tablero Kanban de ítems en producción</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNAS.map((col) => (
          <KanbanColumna
            key={col.key}
            columna={col}
            items={items.filter((i) => i.estatus_produccion === col.key)}
          />
        ))}
      </div>
    </div>
  )
}
