import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { serverFetch } from "@/lib/api-server"
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  DollarSign,
  PackageCheck,
  AlertTriangle,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { API_ROUTES } from "@/lib/api-routes"
import type { DashboardIQS } from "@/types"
import { GraficaVentas } from "./_components/grafica-ventas"

function formatMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value)
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.error === "RefreshTokenError") redirect("/login?error=SessionExpired")

  const queryClient = new QueryClient()
  queryClient.prefetchQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => serverFetch<DashboardIQS>(API_ROUTES.dashboard.stats),
  })

  const stats = await serverFetch<DashboardIQS>(API_ROUTES.dashboard.stats).catch(() => null)

  const avance = Math.min(stats?.avance_meta_pct ?? 0, 100)
  const totalPagos = stats?.pagos_por_forma?.reduce((s, p) => s + p.monto, 0) ?? 0

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen del mes · {stats?.periodo.inicio ?? "—"} al {stats?.periodo.hoy ?? "—"}
          </p>
        </div>

        {/* Meta mensual */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Meta mensual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-2xl">{formatMXN(stats?.ventas ?? 0)}</span>
              <span className="text-muted-foreground self-end">de {formatMXN(stats?.meta_mensual ?? 0)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${avance}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{stats?.avance_meta_pct?.toFixed(1) ?? 0}% completado</p>
          </CardContent>
        </Card>

        {/* Tarjetas de métricas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia neta</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMXN(stats?.ganancia ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Margen {stats?.margen?.toFixed(1) ?? 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos activos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pedidos_activos ?? 0}</div>
              <p className="text-xs text-muted-foreground">Sin entregar ni cancelar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas próximas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.entregas_proximas_48h ?? 0}</div>
              <p className="text-xs text-muted-foreground">En las próximas 48 h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo pendiente</CardTitle>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMXN(stats?.saldo_pendiente ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Por cobrar</p>
            </CardContent>
          </Card>
        </div>

        <GraficaVentas />

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top productos */}
          {stats?.top_productos && stats.top_productos.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Top productos del mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.top_productos.map((p, i) => (
                    <div key={p.nombre_producto} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}.</span>
                      <span className="flex-1 text-sm truncate">{p.nombre_producto}</span>
                      <span className="text-sm font-medium">{formatMXN(p.total_ventas)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagos del mes por forma de pago */}
          {stats?.pagos_por_forma && stats.pagos_por_forma.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Pagos del mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.pagos_por_forma.map((p) => (
                    <div key={p.forma_pago} className="flex items-center gap-3">
                      <span className="flex-1 text-sm truncate">{p.forma_pago_label}</span>
                      <span className="w-10 text-xs text-muted-foreground text-right">
                        {totalPagos > 0 ? Math.round((p.monto / totalPagos) * 100) : 0}%
                      </span>
                      <span className="w-24 text-sm font-medium text-right">{formatMXN(p.monto)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </HydrationBoundary>
  )
}
