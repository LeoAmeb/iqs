"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Eye, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { usePedidos } from "@/hooks/use-pedidos"
import { formatMXN } from "@/lib/cotizador/calculos"
import type { EstatusPedido, PedidoResumen } from "@/types"

type SortField = "folio" | "nombre_cliente" | "fecha_entrega" | "total"
type SortDir = "asc" | "desc"

type FiltroEntrega = "" | "hoy" | "semana" | "vencido"

const FILTROS_ENTREGA: { id: FiltroEntrega; label: string }[] = [
  { id: "vencido", label: "Vencidos" },
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Próximos 7 días" },
]

/** Urgencia por fecha de entrega, independiente del estatus manual del pedido. */
function urgenciaEntrega(fechaEntrega: string | null) {
  if (!fechaEntrega) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(`${fechaEntrega}T00:00:00`)
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)

  if (dias < 0) {
    const n = -dias
    return { color: "text-destructive font-medium", label: `Vencido hace ${n} día${n === 1 ? "" : "s"} (${fechaEntrega})` }
  }
  if (dias === 0) return { color: "text-amber-600 dark:text-amber-400 font-medium", label: "Entrega hoy" }
  if (dias === 1) return { color: "text-amber-600 dark:text-amber-400 font-medium", label: "Entrega mañana" }
  if (dias === 2) return { color: "text-amber-600 dark:text-amber-400 font-medium", label: `Entrega en 2 días (${fechaEntrega})` }
  return { color: "text-muted-foreground", label: `Entrega: ${fechaEntrega}` }
}

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

function PedidosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [estatus, setEstatus] = useState<EstatusPedido | "">("")
  const [soloPendientes, setSoloPendientes] = useState(searchParams.get("pendientes") === "1")
  const [filtroEntrega, setFiltroEntrega] = useState<FiltroEntrega>(
    (searchParams.get("entrega") as FiltroEntrega) || ""
  )
  const [sortField, setSortField] = useState<SortField | "">("")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)

  function toggleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else {
      setSortField("")
    }
    setPage(1)
  }

  const { data, isLoading } = usePedidos({
    search: search || undefined,
    estatus: estatus || undefined,
    pendientes: soloPendientes ? "1" : undefined,
    entrega: filtroEntrega || undefined,
    ordering: sortField ? (sortDir === "desc" ? `-${sortField}` : sortField) : undefined,
    page,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">Gestión de pedidos activos</p>
      </div>

      {/* Filtro activo: pendientes */}
      {soloPendientes && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 w-fit">
          <span>Mostrando solo pedidos pendientes (sin entregar ni cancelar)</span>
          <button
            onClick={() => { setSoloPendientes(false); setPage(1) }}
            className="hover:text-amber-900 dark:hover:text-amber-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filtros rápidos por fecha de entrega */}
      <div className="flex flex-wrap gap-1.5">
        {FILTROS_ENTREGA.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filtroEntrega === f.id ? "default" : "outline"}
            onClick={() => { setFiltroEntrega(filtroEntrega === f.id ? "" : f.id); setPage(1) }}
          >
            {f.label}
          </Button>
        ))}
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

      {/* Tabla — escritorio */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="folio" label="Folio" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead field="nombre_cliente" label="Cliente" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <TableHead>Estatus</TableHead>
              <SortableHead field="fecha_entrega" label="Entrega" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead field="total" label="Total" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-right" />
              <TableHead className="text-right">Anticipo</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.results.length ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No se encontraron pedidos
                </TableCell>
              </TableRow>
            ) : (
              data.results.map((pedido) => (
                <PedidoRow key={pedido.id} pedido={pedido} onVer={() => router.push(`/pedidos/${pedido.id}`)} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tarjetas — móvil */}
      <div className="md:hidden">
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
      </div>

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

export default function PedidosPage() {
  return (
    <Suspense>
      <PedidosContent />
    </Suspense>
  )
}

function SortableHead({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: SortField
  label: string
  sortField: SortField | ""
  sortDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}) {
  const activo = sortField === field
  return (
    <TableHead className={`cursor-pointer select-none ${className ?? ""}`} onClick={() => onSort(field)}>
      <span className={`inline-flex items-center gap-1 ${className?.includes("text-right") ? "flex-row-reverse" : ""}`}>
        {label}
        {activo ? (
          sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
        )}
      </span>
    </TableHead>
  )
}

function PedidoRow({
  pedido,
  onVer,
}: {
  pedido: PedidoResumen
  onVer: () => void
}) {
  const folio = pedido.folio.toString().padStart(4, "0")
  const urgencia = urgenciaEntrega(pedido.fecha_entrega)
  const saldo = Math.round((Number(pedido.total) - Number(pedido.anticipo)) * 100) / 100

  return (
    <TableRow className="cursor-pointer" onClick={onVer}>
      <TableCell className="font-mono text-sm font-bold">#{folio}</TableCell>
      <TableCell className="font-medium">{pedido.nombre_cliente}</TableCell>
      <TableCell>
        <Badge variant={ESTATUS_VARIANT[pedido.estatus]}>{ESTATUS_LABELS[pedido.estatus]}</Badge>
      </TableCell>
      <TableCell className={`text-sm ${urgencia?.color ?? "text-muted-foreground"}`}>
        {urgencia?.label ?? "—"}
      </TableCell>
      <TableCell className="text-right font-medium">{formatMXN(Number(pedido.total))}</TableCell>
      <TableCell className="text-right text-muted-foreground">{formatMXN(Number(pedido.anticipo))}</TableCell>
      <TableCell className="text-right">
        {saldo > 0 ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">{formatMXN(saldo)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onVer() }}>
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
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
  const urgencia = urgenciaEntrega(pedido.fecha_entrega)
  const saldo = Math.round((Number(pedido.total) - Number(pedido.anticipo)) * 100) / 100

  return (
    <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={onVer}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold">#{folio}</span>
            <Badge variant={ESTATUS_VARIANT[pedido.estatus]}>{ESTATUS_LABELS[pedido.estatus]}</Badge>
          </div>
          <p className="font-medium truncate">{pedido.nombre_cliente}</p>
          {urgencia && <p className={`text-xs ${urgencia.color}`}>{urgencia.label}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold">{formatMXN(Number(pedido.total))}</p>
          <p className="text-xs text-muted-foreground">anticipo {formatMXN(Number(pedido.anticipo))}</p>
          {saldo > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Debe {formatMXN(saldo)}</p>
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onVer() }}>
          <Eye className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
