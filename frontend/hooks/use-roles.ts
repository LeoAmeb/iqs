import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { Role, Permission, PaginatedResponse } from "@/types"

interface RolesParams {
  page?: number
  search?: string
}

interface CreateRolePayload {
  name: string
  description: string
  permission_ids: number[]
}

interface UpdateRolePayload {
  name?: string
  description?: string
  permission_ids?: number[]
}

export function useRoles(params?: RolesParams) {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Role>>(API_ROUTES.roles.list, {
        params,
      })
      return data
    },
  })
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: async () => {
      const { data } = await api.get<Role>(API_ROUTES.roles.detail(id))
      return data
    },
    enabled: !!id,
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) =>
      api.post<Role>(API_ROUTES.roles.list, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Rol creado correctamente")
    },
    onError: () => toast.error("Error al crear el rol"),
  })
}

export function useUpdateRole(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRolePayload) =>
      api.patch<Role>(API_ROUTES.roles.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Rol actualizado correctamente")
    },
    onError: () => toast.error("Error al actualizar el rol"),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(API_ROUTES.roles.detail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Rol eliminado correctamente")
    },
    onError: () => toast.error("Error al eliminar el rol"),
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await api.get<Permission[]>(API_ROUTES.permissions.list)
      return data
    },
  })
}
