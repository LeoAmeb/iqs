"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Eye, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { useCotizaciones } from "@/hooks/use-pedidos"
import { formatMXN } from "@/lib/cotizador/calculos"
import type { CotizacionResumen } from "@/types"

export default function CotizacionesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCotizaciones({
    search: search || undefined,
    page,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
        <p className="text-muted-foreground">Historial de cotizaciones generadas</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por cliente o folio..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.results.map((cotizacion) => (
            <CotizacionCard
              key={cotizacion.id}
              cotizacion={cotizacion}
              onVer={() => router.push(`/cotizaciones/${cotizacion.id}`)}
            />
          ))}
          {data?.results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron cotizaciones
            </div>
          )}
        </div>
      )}

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

function CotizacionCard({
  cotizacion,
  onVer,
}: {
  cotizacion: CotizacionResumen
  onVer: () => void
}) {
  const folio = cotizacion.folio.toString().padStart(4, "0")
  const margen = Number(cotizacion.margen)

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold">#{folio}</span>
            <Badge variant="outline" className="text-xs">
              {cotizacion.items_count} {cotizacion.items_count === 1 ? "ítem" : "ítems"}
            </Badge>
            {cotizacion.pedido_id && (
              <Badge variant="secondary" className="text-xs">Pedido generado</Badge>
            )}
          </div>
          <p className="font-medium truncate">{cotizacion.nombre_cliente || "—"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(cotizacion.created_at).toLocaleDateString("es-MX", {
              day: "2-digit", month: "short", year: "numeric",
            })}
            {cotizacion.fecha_entrega && ` · Entrega: ${cotizacion.fecha_entrega}`}
          </p>
        </div>

        <div className="text-right shrink-0 space-y-0.5">
          <p className="font-bold">{formatMXN(Number(cotizacion.total))}</p>
          <p className={`text-xs font-medium ${margen >= 50 ? "text-green-600" : margen >= 25 ? "text-amber-600" : "text-red-600"}`}>
            {margen.toFixed(1)}% margen
          </p>
        </div>

        <Button size="icon" variant="ghost" onClick={onVer}>
          <Eye className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
