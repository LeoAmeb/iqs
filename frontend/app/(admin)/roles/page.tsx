"use client"

import { useState, useEffect } from "react"
import { Plus, Shield, Trash2, Pencil, Users, Loader2 } from "lucide-react"
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, usePermissions } from "@/hooks/use-roles"
import { useHasPermission } from "@/hooks/use-has-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
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
import type { Role, Permission } from "@/types"

const roleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().min(1, "La descripción es requerida"),
  permission_ids: z.array(z.number()),
})

type RoleFormValues = z.infer<typeof roleSchema>

function groupPermissionsByCategory(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {})
}

interface RoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRole?: Role | null
}

function RoleDialog({ open, onOpenChange, editingRole }: RoleDialogProps) {
  const { data: permissions = [], isFetching: permsLoading } = usePermissions()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole(editingRole?.id ?? 0)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permission_ids: [],
    },
  })

  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        description: editingRole.description,
        permission_ids: editingRole.permissions.map((p) => p.id),
      })
    } else {
      form.reset({ name: "", description: "", permission_ids: [] })
    }
  }, [editingRole, form, open])

  async function onSubmit(values: RoleFormValues) {
    if (editingRole) {
      await updateRole.mutateAsync(values)
    } else {
      await createRole.mutateAsync(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRole ? "Editar rol" : "Crear nuevo rol"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del rol</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Administrador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descripción del rol y sus responsabilidades"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissions matrix grouped by category */}
            <FormField
              control={form.control}
              name="permission_ids"
              render={({ field }) => {
                const grouped = groupPermissionsByCategory(permissions)
                return (
                <FormItem>
                  <FormLabel>Permisos</FormLabel>
                  {permsLoading ? (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingRole ? "Guardar cambios" : "Crear rol"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteRoleDialog({ role, open, onOpenChange }: { role: Role; open: boolean; onOpenChange: (open: boolean) => void }) {
  const deleteRole = useDeleteRole()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar rol</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Estás seguro de que deseas eliminar el rol{" "}
          <span className="font-semibold text-foreground">{role.name}</span>?
          Esta acción no se puede deshacer.
          {role.users_count > 0 && (
            <span className="block mt-1 text-destructive">
              Advertencia: {role.users_count} usuario(s) tiene(n) este rol asignado.
            </span>
          )}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={deleteRole.isPending}
            onClick={async () => {
              await deleteRole.mutateAsync(role.id)
              onOpenChange(false)
            }}
          >
            {deleteRole.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function RolesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const canCreate = useHasPermission(PERMISSIONS.ROLES.CREATE)
  const canEdit = useHasPermission(PERMISSIONS.ROLES.EDIT)
  const canDelete = useHasPermission(PERMISSIONS.ROLES.DELETE)

  const { data, isLoading } = useRoles()

  function handleEdit(role: Role) {
    setEditingRole(role)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingRole(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Gestión de roles y permisos del sistema
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Rol
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
          <p className="text-lg font-medium">No hay roles configurados</p>
          <p className="text-sm">Crea el primer rol para empezar</p>
          {canCreate && (
            <Button onClick={handleCreate} className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Crear rol
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((role) => (
            <Card key={role.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <CardTitle className="text-base">{role.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {role.users_count} usuario(s)
                  </span>
                  <span>{role.permissions.length} permiso(s)</span>
                </div>
                {role.permissions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 4).map((perm) => (
                      <Badge key={perm.id} variant="outline" className="text-xs">
                        {perm.codename}
                      </Badge>
                    ))}
                    {role.permissions.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 4} más
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
                    onClick={() => setDeletingRole(role)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(role)}
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

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingRole={editingRole}
      />

      {deletingRole && (
        <DeleteRoleDialog
          role={deletingRole}
          open={!!deletingRole}
          onOpenChange={(open) => !open && setDeletingRole(null)}
        />
      )}
    </div>
  )
}
