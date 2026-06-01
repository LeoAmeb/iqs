"use client"

import { useState } from "react"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, useClienteHistorial } from "@/hooks/use-clientes"
import { formatMXN } from "@/lib/cotizador/calculos"
import type { Cliente } from "@/types"

type FormData = Pick<Cliente, "nombre" | "telefono" | "email" | "notas">

function DialogCliente({
  cliente,
  onClose,
}: {
  cliente: Cliente | null
  onClose: () => void
}) {
  const crear = useCreateCliente()
  const editar = useUpdateCliente(cliente?.id ?? 0)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: cliente ?? { nombre: "", telefono: "", email: "", notas: "" },
  })

  async function onSubmit(data: FormData) {
    if (cliente) {
      await editar.mutateAsync(data)
    } else {
      await crear.mutateAsync(data)
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...register("nombre", { required: "Requerido" })} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register("telefono")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Input {...register("notas")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={crear.isPending || editar.isPending}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HistorialCliente({ clienteId }: { clienteId: number }) {
  const { data: pedidos, isLoading } = useClienteHistorial(clienteId)
  if (isLoading) return <Skeleton className="h-20 w-full" />
  if (!pedidos?.length) return <p className="text-sm text-muted-foreground">Sin pedidos</p>
  return (
    <div className="space-y-2 max-h-48 overflow-auto">
      {pedidos.map((p) => (
        <div key={p.id} className="flex justify-between text-sm">
          <span>#{p.folio.toString().padStart(4, "0")} — {p.estatus}</span>
          <span>{formatMXN(Number(p.total))}</span>
        </div>
      ))}
    </div>
  )
}

export default function ClientesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [dialogoCliente, setDialogoCliente] = useState<Cliente | null | false>(false)
  const [historialId, setHistorialId] = useState<number | null>(null)

  const { data, isLoading } = useClientes({ search: search || undefined, page })
  const eliminar = useDeleteCliente(historialId ?? 0)

  function handleEliminar(id: number) {
    if (confirm("¿Eliminar este cliente?")) {
      setHistorialId(id)
      eliminar.mutate()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes</p>
        </div>
        <Button onClick={() => setDialogoCliente(null)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.results.map((cliente) => (
            <Card key={cliente.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{cliente.nombre}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {cliente.telefono && <span>{cliente.telefono}</span>}
                    {cliente.email && <span>{cliente.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setHistorialId(historialId === cliente.id ? null : cliente.id)}>
                    Historial
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDialogoCliente(cliente)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleEliminar(cliente.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              {historialId === cliente.id && (
                <CardContent className="pt-0 pb-4">
                  <HistorialCliente clienteId={cliente.id} />
                </CardContent>
              )}
            </Card>
          ))}
          {data?.results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No se encontraron clientes</div>
          )}
        </div>
      )}

      {data && (data.next || data.previous) && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      {dialogoCliente !== false && (
        <DialogCliente cliente={dialogoCliente} onClose={() => setDialogoCliente(false)} />
      )}
    </div>
  )
}
