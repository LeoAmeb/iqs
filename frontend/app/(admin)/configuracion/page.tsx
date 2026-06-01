"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useCategorias,
  useDeleteCategoria,
  useConfiguracionSistema,
  useUpdateConfiguracionSistema,
} from "@/hooks/use-productos"
import { WizardCategoria } from "./_components/wizard-categoria"
import type { Categoria, ConfiguracionSistema, TipoCalculo } from "@/types"

const TIPOS_CALCULO: { value: TipoCalculo; label: string; emoji: string }[] = [
  { value: "precio_fijo",   label: "Precio fijo + opciones",      emoji: "🏷️" },
  { value: "por_dimension", label: "Por dimensión",               emoji: "📐" },
  { value: "tabla_tiered",  label: "Tabla de niveles (mayoreo)",  emoji: "📊" },
  { value: "por_hora",      label: "Por horas de trabajo",        emoji: "⏱️" },
  { value: "manual",        label: "Entrada manual",              emoji: "✏️" },
]

// ─── Configuración del sistema ────────────────────────────────────────────────

function ConfiguracionSistemaForm() {
  const { data, isLoading } = useConfiguracionSistema()
  const actualizar = useUpdateConfiguracionSistema()
  const { register, handleSubmit } = useForm<ConfiguracionSistema>({ values: data })

  if (isLoading) return <Skeleton className="h-32 w-full" />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Parámetros globales</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => actualizar.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Hora objetivo ($/hr)</Label>
              <Input type="number" {...register("hora_objetivo", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Hora láser ($/hr)</Label>
              <Input type="number" {...register("hora_laser", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Meta mensual ($)</Label>
              <Input type="number" {...register("meta_mensual", { valueAsNumber: true })} />
            </div>
          </div>
          <Button type="submit" disabled={actualizar.isPending}>
            {actualizar.isPending ? "Guardando..." : "Guardar configuración"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Sección categorías ───────────────────────────────────────────────────────

function SeccionCategorias() {
  const { data, isLoading } = useCategorias()
  const [wizard, setWizard] = useState<Categoria | null | false>(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState<Categoria | null>(null)
  const eliminar = useDeleteCategoria(confirmarEliminar?.id ?? 0)

  async function handleEliminar() {
    if (!confirmarEliminar) return
    await eliminar.mutateAsync()
    setConfirmarEliminar(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Cada categoría define su tipo de cálculo y configuración de precios
          </p>
        </div>
        <Button onClick={() => setWizard(null)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data?.results.map((cat) => {
            const tipo = TIPOS_CALCULO.find((t) => t.value === cat.tipo_calculo)
            return (
              <Card key={cat.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl shrink-0 leading-none">{cat.icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{cat.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tipo?.emoji} {tipo?.label ?? cat.tipo_calculo}
                      <span className="mx-1.5">·</span>
                      Orden {cat.orden}
                    </p>
                  </div>
                  {!cat.activo && <Badge variant="secondary">Inactiva</Badge>}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => setWizard(cat)}
                      title="Editar categoría"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmarEliminar(cat)}
                      title="Eliminar categoría"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {wizard !== false && (
        <WizardCategoria categoria={wizard} onClose={() => setWizard(false)} />
      )}

      {confirmarEliminar && (
        <Dialog open onOpenChange={() => setConfirmarEliminar(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Eliminar categoría?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Se eliminará <strong>{confirmarEliminar.nombre}</strong> y toda su configuración de precios.
              Esta acción no se puede deshacer.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmarEliminar(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={eliminar.isPending}
                onClick={handleEliminar}
              >
                {eliminar.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Parámetros del sistema y configuración de categorías</p>
      </div>

      <ConfiguracionSistemaForm />

      <Separator />

      <SeccionCategorias />
    </div>
  )
}
