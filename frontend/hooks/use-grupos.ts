import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { Grupo, Permission, PaginatedResponse } from "@/types"

interface GruposParams {
  page?: number
  search?: string
}

interface CreateGrupoPayload {
  name: string
  permission_ids: number[]
}

interface UpdateGrupoPayload {
  name?: string
  permission_ids?: number[]
}

export function useGrupos(params?: GruposParams) {
  return useQuery({
    queryKey: ["grupos", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Grupo>>(API_ROUTES.grupos.list, {
        params,
      })
      return data
    },
  })
}

export function useGrupo(id: number) {
  return useQuery({
    queryKey: ["grupos", id],
    queryFn: async () => {
      const { data } = await api.get<Grupo>(API_ROUTES.grupos.detail(id))
      return data
    },
    enabled: !!id,
  })
}

export function useCreateGrupo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGrupoPayload) =>
      api.post<Grupo>(API_ROUTES.grupos.list, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] })
      toast.success("Grupo creado correctamente")
    },
    onError: () => toast.error("Error al crear el grupo"),
  })
}

export function useUpdateGrupo(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateGrupoPayload) =>
      api.patch<Grupo>(API_ROUTES.grupos.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] })
      toast.success("Grupo actualizado correctamente")
    },
    onError: () => toast.error("Error al actualizar el grupo"),
  })
}

export function useDeleteGrupo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(API_ROUTES.grupos.detail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] })
      toast.success("Grupo eliminado correctamente")
    },
    onError: () => toast.error("Error al eliminar el grupo"),
  })
}

export function usePermisos() {
  return useQuery({
    queryKey: ["permisos"],
    queryFn: async () => {
      const { data } = await api.get<Permission[]>(API_ROUTES.permisos.list)
      return data
    },
  })
}
