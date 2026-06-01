"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { usePedidos } from "@/hooks/use-pedidos"
import { formatMXN } from "@/lib/cotizador/calculos"
import type { EstatusPedido, PedidoResumen } from "@/types"

export const ESTATUS_LABELS: Record<EstatusPedido, string> = {
  pendiente: "Pendiente",
  proximo: "Próximo",
  urgente: "Urgente",
  en_produccion: "En Producción",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
}

export const ESTATUS_VARIANT: Record<EstatusPedido, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "secondary",
  proximo: "default",
  urgente: "destructive",
  en_produccion: "default",
  listo: "outline",
  entregado: "outline",
  cancelado: "destructive",
}

export default function PedidosPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [estatus, setEstatus] = useState<EstatusPedido | "">("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePedidos({
    search: search || undefined,
    estatus: estatus || undefined,
    page,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">Gestión de pedidos activos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por cliente, folio..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={estatus || "todos"} onValueChange={(v) => { setEstatus(v === "todos" ? "" : v as EstatusPedido); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(ESTATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.results.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onVer={() => router.push(`/pedidos/${pedido.id}`)}
            />
          ))}
          {data?.results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron pedidos
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {data && (data.next || data.previous) && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage(p => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage(p => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}

function PedidoCard({
  pedido,
  onVer,
}: {
  pedido: PedidoResumen
  onVer: () => void
}) {
  const folio = pedido.folio.toString().padStart(4, "0")
  const hoy = new Date().toISOString().slice(0, 10)
  const vencido = pedido.fecha_entrega && pedido.fecha_entrega < hoy

  return (
    <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={onVer}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold">#{folio}</span>
            <Badge variant={ESTATUS_VARIANT[pedido.estatus]}>{ESTATUS_LABELS[pedido.estatus]}</Badge>
          </div>
          <p className="font-medium truncate">{pedido.nombre_cliente}</p>
          {pedido.fecha_entrega && (
            <p className={`text-xs ${vencido ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              Entrega: {pedido.fecha_entrega}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold">{formatMXN(Number(pedido.total))}</p>
          <p className="text-xs text-muted-foreground">anticipo {formatMXN(Number(pedido.anticipo))}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onVer() }}>
          <Eye className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
