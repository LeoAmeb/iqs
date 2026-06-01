"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, FileText, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { useCotizacion, useProcederCotizacion, useUpdateCotizacionItem } from "@/hooks/use-pedidos"
import { useCotizadorConfig } from "@/hooks/use-productos"
import { formatMXN } from "@/lib/cotizador/calculos"
import { FormularioProducto, type FormularioDefaultValues } from "@/app/(admin)/cotizador/_components/formulario-producto"
import type { Categoria, CotizacionItem, TipoCalculo } from "@/types"

const FORMA_PAGO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
}

function categoriaDesdeItem(item: CotizacionItem): Categoria {
  const detalles = item.detalles as { config_snapshot?: Record<string, unknown> }
  return {
    id: item.categoria ?? 0,
    nombre: item.nombre_producto,
    icono: "📦",
    orden: 0,
    activo: true,
    tipo_calculo: item.tipo_calculo as TipoCalculo,
    config: detalles.config_snapshot ?? {},
    created_at: "",
    updated_at: "",
  }
}

function defaultValuesDesdeItem(item: CotizacionItem): FormularioDefaultValues {
  const detalles = item.detalles as { inputs?: FormularioDefaultValues }
  return {
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    ...(detalles.inputs ?? {}),
  }
}

export default function CotizacionDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const { data: cotizacion, isLoading, isError } = useCotizacion(id)
  const { data: cotizadorConfig } = useCotizadorConfig()
  const updateItem = useUpdateCotizacionItem(id)
  const proceder = useProcederCotizacion()

  const [itemEditando, setItemEditando] = useState<CotizacionItem | null>(null)

  function handleGuardarItem(resultado: Omit<import("@/types").CarritoItem, "_id">) {
    if (!itemEditando) return
    updateItem.mutate(
      {
        itemId: itemEditando.id,
        payload: {
          nombre_producto: resultado.nombre_producto,
          descripcion: resultado.descripcion,
          cantidad: resultado.cantidad,
          precio_unit: resultado.precio_unit,
          total: resultado.total,
          iva_pct: resultado.iva_pct,
          iva: resultado.iva,
          costo: resultado.costo,
          ganancia: resultado.ganancia,
          margen: resultado.margen,
          detalles: resultado.detalles,
        },
      },
      { onSuccess: () => setItemEditando(null) }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (isError || !cotizacion) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <p>No se encontró la cotización.</p>
        <Button variant="outline" onClick={() => router.push("/cotizaciones")}>
          Volver al listado
        </Button>
      </div>
    )
  }

  const folio = cotizacion.folio.toString().padStart(4, "0")
  const margen = Number(cotizacion.margen)
  const margenColor = margen >= 50 ? "text-green-600" : margen >= 25 ? "text-amber-600" : "text-red-600"

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/cotizaciones")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Cotización #{folio}</h1>
            {cotizacion.pedido_id && (
              <Badge variant="secondary">Pedido generado</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(cotizacion.created_at).toLocaleDateString("es-MX", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })}
            {cotizacion.creado_por_nombre && ` · ${cotizacion.creado_por_nombre}`}
          </p>
        </div>

        {cotizacion.pedido_id ? (
          <Button onClick={() => router.push(`/pedidos`)}>
            Ver pedido
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => proceder.mutate(id)}
            disabled={proceder.isPending}
          >
            {proceder.isPending ? "Generando..." : "Proceder al pedido"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Datos del cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Nombre</p>
            <p className="font-medium">{cotizacion.nombre_cliente || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Teléfono</p>
            <p className="font-medium">{cotizacion.telefono || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium">{cotizacion.email || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fecha de entrega</p>
            <p className="font-medium">{cotizacion.fecha_entrega ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Anticipo</p>
            <p className="font-medium">{formatMXN(Number(cotizacion.anticipo))}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Forma de pago</p>
            <p className="font-medium">{FORMA_PAGO_LABELS[cotizacion.forma_pago] ?? (cotizacion.forma_pago || "—")}</p>
          </div>
          {cotizacion.notas && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Notas</p>
              <p className="font-medium">{cotizacion.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ítems ({cotizacion.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cotizacion.items.map((item, i) => (
            <div key={item.id}>
              {i > 0 && <Separator className="mb-3" />}
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.nombre_producto}</p>
                  {item.descripcion && item.descripcion !== item.nombre_producto && (
                    <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.cantidad} × {formatMXN(Number(item.precio_unit))}
                    <span className="ml-2">· IVA {item.iva_pct}%: {formatMXN(Number(item.iva))}</span>
                    <span className="ml-2">· Costo: {formatMXN(Number(item.costo))}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatMXN(Number(item.total))}</p>
                  <p className={`text-xs font-medium ${Number(item.margen) >= 50 ? "text-green-600" : Number(item.margen) >= 25 ? "text-amber-600" : "text-red-600"}`}>
                    {Number(item.margen).toFixed(1)}%
                  </p>
                </div>
                {!cotizacion.pedido_id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setItemEditando(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totales */}
      <Card>
        <CardContent className="pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal sin IVA</span>
            <span>{formatMXN(Number(cotizacion.total) - Number(cotizacion.iva))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>IVA absorbido</span>
            <span className="text-red-500">−{formatMXN(Number(cotizacion.iva))}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{formatMXN(Number(cotizacion.total))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Ganancia estimada</span>
            <span className={margenColor}>
              {formatMXN(Number(cotizacion.ganancia))} ({margen.toFixed(1)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Banner pedido */}
      {cotizacion.pedido_id ? (
        <div className="rounded-lg border bg-muted/50 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Pedido #{folio} generado</p>
            <p className="text-xs text-muted-foreground">La cotización fue convertida a pedido</p>
          </div>
          <Button onClick={() => router.push(`/pedidos`)}>
            Ver en pedidos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Cotización pendiente de confirmación</p>
            <p className="text-xs text-muted-foreground">
              Revisa y ajusta los ítems. Cuando el cliente acepte, presiona "Proceder al pedido".
            </p>
          </div>
          <Button
            onClick={() => proceder.mutate(id)}
            disabled={proceder.isPending}
          >
            {proceder.isPending ? "Generando..." : "Proceder al pedido"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Sheet — editar ítem */}
      <Sheet open={!!itemEditando} onOpenChange={(open) => !open && setItemEditando(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Editar ítem</SheetTitle>
          </SheetHeader>
          {itemEditando && cotizadorConfig && (
            <FormularioProducto
              key={itemEditando.id}
              categoria={categoriaDesdeItem(itemEditando)}
              config={cotizadorConfig.configuracion}
              carritoTiered={[]}
              defaultValues={defaultValuesDesdeItem(itemEditando)}
              mode="editar"
              onAgregar={handleGuardarItem}
            />
          )}
          {itemEditando && !cotizadorConfig && (
            <div className="text-sm text-muted-foreground">Cargando configuración...</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
