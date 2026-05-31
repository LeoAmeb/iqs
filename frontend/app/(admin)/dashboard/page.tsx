import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { serverFetch } from "@/lib/api-server"
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { API_ROUTES } from "@/lib/api-routes"
import type { DashboardStats, AuditLog } from "@/types"

function getActionBadgeVariant(action: AuditLog["action"]) {
  const map: Record<AuditLog["action"], "default" | "secondary" | "destructive" | "outline"> = {
    create: "default",
    update: "secondary",
    delete: "destructive",
    login: "outline",
    logout: "outline",
  }
  return map[action] ?? "outline"
}

function getActionLabel(action: AuditLog["action"]): string {
  const labels: Record<AuditLog["action"], string> = {
    create: "Creó",
    update: "Actualizó",
    delete: "Eliminó",
    login: "Inició sesión",
    logout: "Cerró sesión",
  }
  return labels[action]
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.error === "RefreshTokenError") redirect("/login?error=SessionExpired")

  // Prefetch with TanStack Query so client components can read from cache
  // without a second network request. No `await` needed — Next.js streams
  // the page while the fetch resolves.
  const queryClient = new QueryClient()
  queryClient.prefetchQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => serverFetch<DashboardStats>(API_ROUTES.dashboard.stats),
  })

  // Also fetch synchronously for the initial render (Server Component render)
  const stats = await serverFetch<DashboardStats>(API_ROUTES.dashboard.stats).catch(() => null)

  const statCards = [
    { title: "Total Usuarios",  value: stats?.total_users   ?? 0, icon: Users,    description: "Usuarios registrados" },
    { title: "Usuarios Activos",value: stats?.active_users  ?? 0, icon: UserCheck,description: "Con acceso habilitado" },
    { title: "Nuevos (30d)",    value: stats?.new_users_30d ?? 0, icon: UserPlus, description: "Registros recientes" },
    { title: "Roles",           value: stats?.roles_count   ?? 0, icon: Shield,   description: "Roles configurados" },
  ]

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general de la plataforma</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {card.value.toLocaleString("es-MX")}
                </div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.recent_activity?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead className="hidden sm:table-cell">IP</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_activity.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.user
                          ? `${log.user.first_name} ${log.user.last_name}`
                          : "Sistema"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.resource_type}
                        {log.resource_id && ` #${log.resource_id}`}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {log.ip_address ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </HydrationBoundary>
  )
}
