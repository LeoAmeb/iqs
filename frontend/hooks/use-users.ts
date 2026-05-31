import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { User, PaginatedResponse } from "@/types"

interface UsersParams {
  page?: number
  search?: string
  is_active?: boolean
  page_size?: number
}

export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>(API_ROUTES.users.list, {
        params,
      })
      return data
    },
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const { data } = await api.get<User>(API_ROUTES.users.detail(id))
      return data
    },
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<User> & { password: string }) =>
      api.post<User>(API_ROUTES.users.list, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario creado correctamente")
    },
    onError: () => toast.error("Error al crear el usuario"),
  })
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<User>) =>
      api.patch<User>(API_ROUTES.users.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario actualizado correctamente")
    },
    onError: () => toast.error("Error al actualizar el usuario"),
  })
}

export function useToggleUserActive(id: number, currentIsActive: boolean) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.patch<User>(API_ROUTES.users.detail(id), { is_active: !currentIsActive }).then((r) => r.data),
    onSuccess: (data: User) => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success(data.is_active ? "Usuario activado" : "Usuario desactivado")
    },
    onError: () => toast.error("Error al cambiar el estado del usuario"),
  })
}
