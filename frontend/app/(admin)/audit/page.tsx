"use client"

import { useState } from "react"
import { Download, ClipboardList, Filter } from "lucide-react"
import { useAuditLogs } from "@/hooks/use-audit"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AuditLog } from "@/types"

const PAGE_SIZE = 20

const ACTION_OPTIONS = [
  { value: "all", label: "Todas las acciones" },
  { value: "create", label: "Creación" },
  { value: "update", label: "Actualización" },
  { value: "delete", label: "Eliminación" },
  { value: "login", label: "Inicio de sesión" },
  { value: "logout", label: "Cierre de sesión" },
]

const ACTION_LABELS: Record<AuditLog["action"], string> = {
  create: "Creó",
  update: "Actualizó",
  delete: "Eliminó",
  login: "Inició sesión",
  logout: "Cerró sesión",
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

function getActionVariant(action: AuditLog["action"]): BadgeVariant {
  const map: Record<AuditLog["action"], BadgeVariant> = {
    create: "success",
    update: "secondary",
    delete: "destructive",
    login: "default",
    logout: "outline",
  }
  return map[action]
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString))
}

function exportToCSV(logs: AuditLog[]) {
  const headers = ["ID", "Usuario", "Correo", "Acción", "Recurso", "ID Recurso", "IP", "Fecha"]
  const rows = logs.map((log) => [
    log.id,
    log.user ? `${log.user.first_name} ${log.user.last_name}` : "Sistema",
    log.user?.email ?? "",
    ACTION_LABELS[log.action],
    log.resource_type,
    log.resource_id,
    log.ip_address ?? "",
    formatDate(log.created_at),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n")

  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function AuditTableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const { data, isLoading } = useAuditLogs({
    page,
    page_size: PAGE_SIZE,
    action: action === "all" ? undefined : action,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1

  function handleExport() {
    if (data?.results) {
      exportToCSV(data.results)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
          <p className="text-muted-foreground">
            Registro de actividad del sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!data?.results.length}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <DatePicker
                value={dateFrom}
                onChange={(v) => { setDateFrom(v); setPage(1) }}
                onClear={() => { setDateFrom(""); setPage(1) }}
                placeholder="Desde"
                className="w-full sm:w-40"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <DatePicker
                value={dateTo}
                onChange={(v) => { setDateTo(v); setPage(1) }}
                onClear={() => { setDateTo(""); setPage(1) }}
                placeholder="Hasta"
                className="w-full sm:w-40"
              />
            </div>

            {(action !== "all" || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAction("all")
                  setDateFrom("")
                  setDateTo("")
                  setPage(1)
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="hidden md:table-cell">IP</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AuditTableSkeleton />
            ) : !data?.results.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No hay registros de auditoría</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.results.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {log.user
                          ? `${log.user.first_name} ${log.user.last_name}`
                          : "Sistema"}
                      </p>
                      {log.user && (
                        <p className="text-xs text-muted-foreground">
                          {log.user.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionVariant(log.action)}>
                      {ACTION_LABELS[log.action]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.resource_type}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.resource_id || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {log.ip_address ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data?.count ?? 0} registros en total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
