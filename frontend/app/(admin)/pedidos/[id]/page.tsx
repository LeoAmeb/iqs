"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { usePedido, useUpdatePedido, useDeletePedido } from "@/hooks/use-pedidos"
import { useActualizarEstatusProduccion } from "@/hooks/use-produccion"
import { formatMXN } from "@/lib/cotizador/calculos"
import { ESTATUS_LABELS, ESTATUS_VARIANT } from "@/app/(admin)/pedidos/page"
import type { EstatusPedido, EstatusProduccion, PedidoItem } from "@/types"

const PROD_LABELS: Record<EstatusProduccion, string> = {
  pendiente: "Pendiente",
  en_produccion: "En producción",
  listo: "Listo",
  entregado: "Entregado",
}

const PROD_VARIANT: Record<EstatusProduccion, "default" | "secondary" | "outline"> = {
  pendiente: "secondary",
  en_produccion: "default",
  listo: "outline",
  entregado: "outline",
}

const PROD_SIGUIENTE: Record<EstatusProduccion, EstatusProduccion | null> = {
  pendiente: "en_produccion",
  en_produccion: "listo",
  listo: "entregado",
  entregado: null,
}

const PROD_SIGUIENTE_LABEL: Record<EstatusProduccion, string> = {
  pendiente: "Iniciar producción",
  en_produccion: "Marcar listo",
  listo: "Entregar",
  entregado: "",
}

type LiquidarPendiente = { incluirEstatusEntregado: boolean; onExito?: () => void } | null

export default function PedidoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const { data: pedido, isLoading, isError } = usePedido(id)
  const updatePedido = useUpdatePedido(id)
  const deletePedido = useDeletePedido(id)

  const [liquidar, setLiquidar] = useState<LiquidarPendiente>(null)
  const [formaPagoLiquidar, setFormaPagoLiquidar] = useState<"" | "efectivo" | "transferencia" | "tarjeta">("")

  function cancelarLiquidacion() {
    setLiquidar(null)
    setFormaPagoLiquidar("")
  }

  function confirmarLiquidacion() {
    if (!liquidar || !formaPagoLiquidar || !pedido) return
    const payload: Partial<Pick<typeof pedido, "anticipo" | "forma_pago" | "estatus">> = {
      anticipo: pedido.total,
      forma_pago: formaPagoLiquidar,
    }
    if (liquidar.incluirEstatusEntregado) payload.estatus = "entregado"
    updatePedido.mutate(payload, {
      onSuccess: () => {
        liquidar.onExito?.()
        cancelarLiquidacion()
      },
    })
  }

  function handleEliminar() {
    if (confirm("¿Eliminar este pedido? Esta acción no se puede deshacer.")) {
      deletePedido.mutate(undefined, {
        onSuccess: () => router.push("/pedidos"),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !pedido) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <p>No se encontró el pedido.</p>
        <Button variant="outline" onClick={() => router.push("/pedidos")}>
          Volver al listado
        </Button>
      </div>
    )
  }

  const folio = pedido.folio.toString().padStart(4, "0")
  const hoy = new Date().toISOString().slice(0, 10)
  const vencido = pedido.fecha_entrega && pedido.fecha_entrega < hoy
  const saldoPendiente = Math.round((Number(pedido.total) - Number(pedido.anticipo)) * 100) / 100

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pedidos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Pedido #{folio}</h1>
            <Badge variant={ESTATUS_VARIANT[pedido.estatus]}>{ESTATUS_LABELS[pedido.estatus]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {pedido.nombre_cliente}
            {pedido.creado_por_nombre && ` · ${pedido.creado_por_nombre}`}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleEliminar}
          disabled={deletePedido.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Información
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Teléfono</p>
            <p className="font-medium">{pedido.telefono || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fecha de entrega</p>
            <p className={`font-medium ${vencido ? "text-destructive" : ""}`}>
              {pedido.fecha_entrega ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="font-bold">{formatMXN(Number(pedido.total))}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Anticipo</p>
            <p className="font-medium">{formatMXN(Number(pedido.anticipo))}</p>
          </div>
          <div className="col-span-2">
            {saldoPendiente > 0 ? (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950 px-3 py-2 text-amber-700 dark:text-amber-300 font-medium">
                El cliente debe {formatMXN(saldoPendiente)}
              </div>
            ) : (
              <div className="rounded-md bg-green-50 dark:bg-green-950 px-3 py-2 text-green-700 dark:text-green-300 font-medium">
                Pedido liquidado
              </div>
            )}
          </div>
          {pedido.notas && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Notas</p>
              <p className="font-medium">{pedido.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatus manual */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-2">Estatus del pedido</p>
          <Select
            value={pedido.estatus}
            onValueChange={(v) => {
              if (v === "entregado" && saldoPendiente > 0) {
                setLiquidar({ incluirEstatusEntregado: true })
                return
              }
              updatePedido.mutate({ estatus: v as EstatusPedido })
            }}
            disabled={updatePedido.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ESTATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            El estatus se actualiza automáticamente según el progreso de producción de los ítems.
            Puedes sobreescribirlo manualmente aquí.
          </p>
        </CardContent>
      </Card>

      {/* Ítems de producción */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ítems de producción ({pedido.items.length})
        </h2>
        {pedido.items.map((item) => (
          <ItemProduccionCard
            key={item.id}
            item={item}
            saldoPendiente={saldoPendiente}
            esUltimoPendiente={pedido.items
              .filter((i) => i.id !== item.id)
              .every((i) => i.estatus_produccion === "entregado")}
            onRequiereLiquidar={(continuar) => setLiquidar({ incluirEstatusEntregado: false, onExito: continuar })}
          />
        ))}
      </div>

      {/* Liquidar antes de marcar entregado */}
      <Dialog open={!!liquidar} onOpenChange={(open) => { if (!open) cancelarLiquidacion() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liquidar pedido</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            El cliente debe <span className="font-semibold text-foreground">{formatMXN(saldoPendiente)}</span>.
            Registra cómo se cobró antes de marcar el pedido como entregado.
          </p>
          <div className="space-y-2">
            <Label htmlFor="forma-pago-liquidar">Forma de pago</Label>
            <Select value={formaPagoLiquidar} onValueChange={(v) => setFormaPagoLiquidar(v as typeof formaPagoLiquidar)}>
              <SelectTrigger id="forma-pago-liquidar">
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelarLiquidacion}>
              Cancelar
            </Button>
            <Button disabled={!formaPagoLiquidar || updatePedido.isPending} onClick={confirmarLiquidacion}>
              {updatePedido.isPending ? "Guardando..." : "Liquidar y marcar entregado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ItemProduccionCard({
  item,
  saldoPendiente,
  esUltimoPendiente,
  onRequiereLiquidar,
}: {
  item: PedidoItem
  saldoPendiente: number
  esUltimoPendiente: boolean
  onRequiereLiquidar: (continuar: () => void) => void
}) {
  const [logsAbiertos, setLogsAbiertos] = useState(false)
  const actualizar = useActualizarEstatusProduccion(item.id)
  const siguiente = PROD_SIGUIENTE[item.estatus_produccion]

  function handleAvanzar() {
    if (!siguiente) return
    if (siguiente === "entregado" && esUltimoPendiente && saldoPendiente > 0) {
      onRequiereLiquidar(() => actualizar.mutate({ estatus_produccion: siguiente }))
      return
    }
    actualizar.mutate({ estatus_produccion: siguiente })
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Encabezado del ítem */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium">{item.nombre_producto}</p>
            {item.descripcion && item.descripcion !== item.nombre_producto && (
              <p className="text-sm text-muted-foreground">{item.descripcion}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.cantidad} × {formatMXN(Number(item.precio_unit))} = {formatMXN(Number(item.total))}
            </p>
          </div>
          <Badge variant={PROD_VARIANT[item.estatus_produccion]}>
            {PROD_LABELS[item.estatus_produccion]}
          </Badge>
        </div>

        {/* Progreso visual */}
        <ProgresoProduccion estatus={item.estatus_produccion} />

        {/* Botón avanzar */}
        {siguiente && (
          <Button
            size="sm"
            className="w-full"
            onClick={handleAvanzar}
            disabled={actualizar.isPending}
          >
            {PROD_SIGUIENTE_LABEL[item.estatus_produccion]}
          </Button>
        )}

        {/* Historial */}
        {item.logs.length > 0 && (
          <>
            <Separator />
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
              onClick={() => setLogsAbiertos((v) => !v)}
            >
              {logsAbiertos ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Historial ({item.logs.length})
            </button>
            {logsAbiertos && (
              <div className="space-y-1.5 pt-1">
                {item.logs.map((log) => (
                  <div key={log.id} className="text-xs text-muted-foreground flex justify-between gap-2">
                    <span>
                      <span className="font-medium text-foreground">{PROD_LABELS[log.estatus_anterior]}</span>
                      {" → "}
                      <span className="font-medium text-foreground">{PROD_LABELS[log.estatus_nuevo]}</span>
                      {log.nota && <span className="ml-1 italic">"{log.nota}"</span>}
                    </span>
                    <span className="shrink-0">
                      {log.usuario_nombre && `${log.usuario_nombre} · `}
                      {new Date(log.created_at).toLocaleDateString("es-MX", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const PROD_PASOS: EstatusProduccion[] = ["pendiente", "en_produccion", "listo", "entregado"]

function ProgresoProduccion({ estatus }: { estatus: EstatusProduccion }) {
  const idx = PROD_PASOS.indexOf(estatus)
  return (
    <div className="flex gap-1">
      {PROD_PASOS.map((paso, i) => (
        <div
          key={paso}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= idx ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}
