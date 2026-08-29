"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Check, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { useCotizadorConfig } from "@/hooks/use-productos"
import { useCrearCotizacion } from "@/hooks/use-pedidos"
import { useClientes } from "@/hooks/use-clientes"
import { totalesCarrito, formatMXN, aplicarDescuento } from "@/lib/cotizador/calculos"
import { FormularioProducto } from "./_components/formulario-producto"
import type { Categoria, CarritoItem, Cliente } from "@/types"
import { nanoid } from "@/lib/utils"

const schemaDatosCliente = z.object({
  nombre_cliente: z.string().min(1, "Requerido"),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  fecha_entrega: z.string().optional(),
  anticipo: z.number().min(0).optional(),
  forma_pago: z.enum(["efectivo", "transferencia", "tarjeta"]).optional(),
  notas: z.string().optional(),
})

type DatosCliente = z.infer<typeof schemaDatosCliente>

export default function CotizadorPage() {
  const router = useRouter()
  const { data: config, isLoading } = useCotizadorConfig()
  const crearCotizacion = useCrearCotizacion()

  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [carritoMobileAbierto, setCarritoMobileAbierto] = useState(false)
  const [configuracionActiva, setConfiguracionActiva] = useState<Categoria | null>(null)
  const [addKey, setAddKey] = useState(0)
  const [ultimoAgregado, setUltimoAgregado] = useState<string | null>(null)

  // Estado del buscador de clientes en el diálogo
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const busquedaRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: resultadosClientes } = useClientes(
    busquedaCliente.length >= 2 ? { search: busquedaCliente, page_size: 6 } : undefined
  )

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        busquedaRef.current &&
        !busquedaRef.current.contains(e.target as Node)
      ) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener("mousedown", handleClickFuera)
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [])

  const form = useForm<DatosCliente>({
    resolver: zodResolver(schemaDatosCliente),
    defaultValues: { nombre_cliente: "" },
  })

  function seleccionarCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente)
    setBusquedaCliente(cliente.nombre)
    setDropdownAbierto(false)
    form.setValue("nombre_cliente", cliente.nombre)
    form.setValue("telefono", cliente.telefono ?? "")
    form.setValue("email", cliente.email ?? "")
  }

  function limpiarCliente() {
    setClienteSeleccionado(null)
    setBusquedaCliente("")
    form.setValue("nombre_cliente", "")
    form.setValue("telefono", "")
    form.setValue("email", "")
  }

  const totales = totalesCarrito(carrito)

  const categorias = useMemo(
    () => config?.categorias ?? [],
    [config]
  )

  function seleccionar(conf: Categoria) {
    setConfiguracionActiva(conf)
    setAddKey(0)
    setUltimoAgregado(null)
  }

  function volver() {
    setConfiguracionActiva(null)
    setUltimoAgregado(null)
  }

  function agregarAlCarrito(item: Omit<CarritoItem, "_id">) {
    setCarrito((prev) => [...prev, { ...item, _id: nanoid() }])
    setUltimoAgregado(item.nombre_producto)
    setAddKey((k) => k + 1)
    setTimeout(() => setUltimoAgregado(null), 2500)
  }

  function quitarDelCarrito(id: string) {
    setCarrito((prev) => prev.filter((i) => i._id !== id))
  }

  function actualizarDescuento(id: string, descuentoPct: number) {
    const pct = Math.min(Math.max(descuentoPct, 0), 100)
    setCarrito((prev) =>
      prev.map((item) => {
        if (item._id !== id) return item
        const recalculado = aplicarDescuento(item, pct)
        return { ...item, ...recalculado, descuento_pct: pct || undefined }
      })
    )
  }

  async function confirmarCotizacion(datos: DatosCliente) {
    const cotizacion = await crearCotizacion.mutateAsync({
      cliente_id: clienteSeleccionado?.id ?? null,
      ...datos,
      fecha_entrega: datos.fecha_entrega || undefined,
      total: totales.total,
      costo: totales.costo,
      iva: totales.iva,
      ganancia: totales.ganancia,
      margen: totales.margen,
      items: carrito.map((item) => ({
        categoria_id: item.categoria_id,
        nombre_producto: item.nombre_producto,
        tipo_calculo: item.tipo_calculo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unit: item.precio_unit,
        total: item.total,
        iva_pct: item.iva_pct,
        iva: item.iva,
        costo: item.costo,
        ganancia: item.ganancia,
        margen: item.margen,
        detalles: item.descuento_pct ? { ...item.detalles, descuento_pct: item.descuento_pct } : item.detalles,
      })),
    })
    setCarrito([])
    setDialogoAbierto(false)
    setCarritoMobileAbierto(false)
    setClienteSeleccionado(null)
    setBusquedaCliente("")
    form.reset()
    router.push(`/cotizaciones/${cotizacion.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48 mb-1" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        </div>
        <div className="hidden md:block w-72 shrink-0">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!config) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Error al cargar las configuraciones</div>
  }

  const ContenidoCarrito = () => (
    <>
      {carrito.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin ítems aún</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 max-h-72 overflow-auto">
            {carrito.map((item) => (
              <div key={item._id} className="flex items-start gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight truncate">{item.nombre_producto}</p>
                  <p className="text-muted-foreground text-xs truncate">{item.descripcion}</p>
                  <p className="text-xs">
                    {item.cantidad} × {formatMXN(item.precio_unit)} ={" "}
                    {item.descuento_pct ? (
                      <>
                        <span className="line-through text-muted-foreground mr-1">
                          {formatMXN(item.precio_unit * item.cantidad)}
                        </span>
                        <span className="font-medium">{formatMXN(item.total)}</span>
                      </>
                    ) : (
                      formatMXN(item.total)
                    )}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.descuento_pct ?? ""}
                      onChange={(e) => actualizarDescuento(item._id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="h-6 w-14 text-xs px-1.5"
                    />
                    <span className="text-xs text-muted-foreground">% desc.</span>
                  </div>
                </div>
                <button
                  onClick={() => quitarDelCarrito(item._id)}
                  className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatMXN(totales.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Sin IVA</span>
              <span>{formatMXN(totales.total - totales.iva)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>IVA absorbido</span>
              <span className="text-red-500">−{formatMXN(totales.iva)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Ganancia</span>
              <span>{formatMXN(totales.ganancia)} ({totales.margen.toFixed(1)}%)</span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => { setCarritoMobileAbierto(false); setDialogoAbierto(true) }}
          >
            Cotizar
          </Button>
        </div>
      )}
    </>
  )

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-24 md:pb-0">
      {/* Área principal */}
      <div className="flex-1 space-y-4 min-w-0 overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizador</h1>
          <p className="text-muted-foreground text-sm">
            {configuracionActiva
              ? "Ajusta los parámetros según el pedido del cliente"
              : "Selecciona una configuración como punto de partida"}
          </p>
        </div>

        {/* Vista: grid de categorías */}
        {!configuracionActiva && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => seleccionar(cat)}
                className="group flex flex-col items-center justify-center gap-3 p-5 rounded-xl border bg-card hover:bg-muted hover:border-foreground/30 hover:shadow-sm transition-all text-center aspect-square"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-150 leading-none">
                  {cat.icono}
                </span>
                <span className="text-sm font-medium leading-tight">{cat.nombre}</span>
              </button>
            ))}
          </div>
        )}

        {/* Vista: formulario de la configuración seleccionada */}
        {configuracionActiva && (
          <div className="space-y-3">
            {/* Volver */}
            <button
              onClick={volver}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Configuraciones
            </button>

            {/* Banner de confirmación */}
            {ultimoAgregado && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                <Check className="h-4 w-4 shrink-0" />
                <span><strong>{ultimoAgregado}</strong> agregado al carrito</span>
              </div>
            )}

            {/* Formulario */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{configuracionActiva.icono}</span>
                  {configuracionActiva.nombre}
                </CardTitle>

              </CardHeader>
              <CardContent>
                <FormularioProducto
                  key={`${configuracionActiva.id}-${addKey}`}
                  categoria={configuracionActiva}
                  config={config.configuracion}
                  carritoTiered={carrito.filter((i) => i.tipo_calculo === "tabla_tiered")}
                  onAgregar={agregarAlCarrito}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Carrito — desktop */}
      <div className="hidden md:block w-72 shrink-0">
        <Card className="sticky top-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Carrito
                {carrito.length > 0 && <Badge variant="secondary">{carrito.length}</Badge>}
              </div>
              {carrito.length > 0 && (
                <span className="text-lg font-bold">{formatMXN(totales.total)}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContenidoCarrito />
          </CardContent>
        </Card>
      </div>

      {/* Barra inferior — móvil */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background px-4 py-3 transition-transform ${carrito.length > 0 ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-0.5">Total</p>
            <p className="text-xl font-bold leading-none">{formatMXN(totales.total)}</p>
          </div>
          <Button size="sm" className="gap-2 shrink-0" onClick={() => setCarritoMobileAbierto(true)}>
            <ShoppingCart className="h-4 w-4" />
            Ver carrito
            <span className="bg-white text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {carrito.length}
            </span>
          </Button>
        </div>
      </div>

      {/* Sheet carrito — móvil */}
      <Sheet open={carritoMobileAbierto} onOpenChange={setCarritoMobileAbierto}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center justify-between">
              <span>Carrito ({carrito.length})</span>
              {carrito.length > 0 && <span className="text-xl font-bold">{formatMXN(totales.total)}</span>}
            </SheetTitle>
          </SheetHeader>
          <ContenidoCarrito />
        </SheetContent>
      </Sheet>

      {/* Diálogo datos del cliente */}
      <Dialog open={dialogoAbierto} onOpenChange={(open) => {
        setDialogoAbierto(open)
        if (!open) setDropdownAbierto(false)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Datos del cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(confirmarCotizacion)} className="space-y-4">
            {/* Buscador de cliente */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <div className="relative">
                <div className="flex gap-1">
                  <Input
                    ref={busquedaRef}
                    value={busquedaCliente}
                    onChange={(e) => {
                      setBusquedaCliente(e.target.value)
                      form.setValue("nombre_cliente", e.target.value)
                      if (clienteSeleccionado) setClienteSeleccionado(null)
                      setDropdownAbierto(e.target.value.length >= 2)
                    }}
                    onFocus={() => busquedaCliente.length >= 2 && setDropdownAbierto(true)}
                    placeholder="Buscar o escribir nombre..."
                    className={clienteSeleccionado ? "border-green-500" : ""}
                  />
                  {busquedaCliente && (
                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={limpiarCliente}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Dropdown de resultados */}
                {dropdownAbierto && resultadosClientes && resultadosClientes.results.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
                  >
                    {resultadosClientes.results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); seleccionarCliente(c) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{c.nombre}</span>
                        {c.telefono && <span className="text-muted-foreground ml-2 text-xs">{c.telefono}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {clienteSeleccionado && (
                <p className="text-xs text-green-600">Cliente existente seleccionado — no se creará uno nuevo</p>
              )}
              {!clienteSeleccionado && busquedaCliente && (
                <p className="text-xs text-muted-foreground">Se creará un cliente nuevo con este nombre</p>
              )}
              {form.formState.errors.nombre_cliente && (
                <p className="text-xs text-destructive">{form.formState.errors.nombre_cliente.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" {...form.register("telefono")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_entrega">Entrega</Label>
                <Input id="fecha_entrega" type="date" {...form.register("fecha_entrega")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="anticipo">Anticipo</Label>
                <Input
                  id="anticipo"
                  type="number"
                  min={0}
                  {...form.register("anticipo", { setValueAs: (v) => (v === "" ? 0 : Number(v)) })}
                />
                {form.formState.errors.anticipo && (
                  <p className="text-xs text-destructive">{form.formState.errors.anticipo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="forma_pago">Forma de pago</Label>
                <Select
                  value={form.watch("forma_pago") ?? ""}
                  onValueChange={(v) => form.setValue("forma_pago", v as "efectivo" | "transferencia" | "tarjeta")}
                >
                  <SelectTrigger id="forma_pago">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Input id="notas" {...form.register("notas")} />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between font-bold">
                <span>Total cotización</span>
                <span>{formatMXN(totales.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ganancia estimada</span>
                <span>{formatMXN(totales.ganancia)} ({totales.margen.toFixed(1)}%)</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearCotizacion.isPending}>
                {crearCotizacion.isPending ? "Guardando..." : "Crear cotización"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
