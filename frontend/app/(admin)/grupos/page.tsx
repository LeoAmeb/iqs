"use client"

import { useState, useEffect } from "react"
import { Plus, Shield, Trash2, Pencil, Users, Loader2 } from "lucide-react"
import { useGrupos, useCreateGrupo, useUpdateGrupo, useDeleteGrupo, usePermisos } from "@/hooks/use-grupos"
import { useHasPermission } from "@/hooks/use-has-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Grupo, Permission } from "@/types"

const grupoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(150, "Máximo 150 caracteres"),
  permission_ids: z.array(z.number()),
})

type GrupoFormValues = z.infer<typeof grupoSchema>

function groupPermissionsByCategory(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {})
}

interface GrupoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGrupo?: Grupo | null
}

function GrupoDialog({ open, onOpenChange, editingGrupo }: GrupoDialogProps) {
  const { data: permisos = [], isFetching: permisosLoading } = usePermisos()
  const createGrupo = useCreateGrupo()
  const updateGrupo = useUpdateGrupo(editingGrupo?.id ?? 0)

  const form = useForm<GrupoFormValues>({
    resolver: zodResolver(grupoSchema),
    defaultValues: { name: "", permission_ids: [] },
  })

  useEffect(() => {
    if (editingGrupo) {
      form.reset({
        name: editingGrupo.name,
        permission_ids: editingGrupo.permissions.map((p) => p.id),
      })
    } else {
      form.reset({ name: "", permission_ids: [] })
    }
  }, [editingGrupo, form, open])

  async function onSubmit(values: GrupoFormValues) {
    if (editingGrupo) {
      await updateGrupo.mutateAsync(values)
    } else {
      await createGrupo.mutateAsync(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingGrupo ? "Editar grupo" : "Crear nuevo grupo"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del grupo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permission_ids"
              render={({ field }) => {
                const grouped = groupPermissionsByCategory(permisos)
                return (
                  <FormItem>
                    <FormLabel>Permisos</FormLabel>
                    {permisosLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-md border p-4">
                        {Object.entries(grouped).map(([category, perms]) => (
                          <div key={category}>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              {category}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {perms.map((perm) => (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <Checkbox
                                    checked={field.value.includes(perm.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, perm.id])
                                      } else {
                                        field.onChange(
                                          field.value.filter((id) => id !== perm.id)
                                        )
                                      }
                                    }}
                                  />
                                  <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors">
                                    {perm.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        {Object.keys(grouped).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay permisos disponibles
                          </p>
                        )}
                      </div>
                    )}
                  </FormItem>
                )
              }}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingGrupo ? "Guardar cambios" : "Crear grupo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteGrupoDialog({
  grupo,
  open,
  onOpenChange,
}: {
  grupo: Grupo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const deleteGrupo = useDeleteGrupo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar grupo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Estás seguro de que deseas eliminar el grupo{" "}
          <span className="font-semibold text-foreground">{grupo.name}</span>?
          Esta acción no se puede deshacer.
          {grupo.users_count > 0 && (
            <span className="block mt-1 text-destructive">
              Advertencia: {grupo.users_count} usuario(s) pertenece(n) a este grupo.
            </span>
          )}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={deleteGrupo.isPending}
            onClick={async () => {
              await deleteGrupo.mutateAsync(grupo.id)
              onOpenChange(false)
            }}
          >
            {deleteGrupo.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function GruposPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [deletingGrupo, setDeletingGrupo] = useState<Grupo | null>(null)
  const canCreate = useHasPermission(PERMISSIONS.GRUPOS.CREATE)
  const canEdit = useHasPermission(PERMISSIONS.GRUPOS.EDIT)
  const canDelete = useHasPermission(PERMISSIONS.GRUPOS.DELETE)

  const { data, isLoading } = useGrupos()

  function handleEdit(grupo: Grupo) {
    setEditingGrupo(grupo)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingGrupo(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos</h1>
          <p className="text-muted-foreground">
            Gestión de grupos y permisos del sistema
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Grupo
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !data?.results.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Shield className="h-16 w-16 opacity-20" />
          <p className="text-lg font-medium">No hay grupos configurados</p>
          <p className="text-sm">Crea el primer grupo para empezar</p>
          {canCreate && (
            <Button onClick={handleCreate} className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Crear grupo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((grupo) => (
            <Card key={grupo.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <CardTitle className="text-base">{grupo.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {grupo.users_count} usuario(s)
                  </span>
                  <span>{grupo.permissions.length} permiso(s)</span>
                </div>
                {grupo.permissions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {grupo.permissions.slice(0, 4).map((perm) => (
                      <Badge key={perm.id} variant="outline" className="text-xs">
                        {perm.codename}
                      </Badge>
                    ))}
                    {grupo.permissions.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{grupo.permissions.length - 4} más
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t pt-4">
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingGrupo(grupo)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(grupo)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <GrupoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingGrupo={editingGrupo}
      />

      {deletingGrupo && (
        <DeleteGrupoDialog
          grupo={deletingGrupo}
          open={!!deletingGrupo}
          onOpenChange={(open) => !open && setDeletingGrupo(null)}
        />
      )}
    </div>
  )
}
