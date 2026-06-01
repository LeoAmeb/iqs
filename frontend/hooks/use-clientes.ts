import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { Cliente, PaginatedResponse, PedidoResumen } from "@/types"

interface ClientesParams {
  page?: number
  search?: string
  page_size?: number
}

export function useClientes(params?: ClientesParams) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Cliente>>(API_ROUTES.clientes.list, { params })
      return data
    },
  })
}

export function useCliente(id: number) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: async () => {
      const { data } = await api.get<Cliente>(API_ROUTES.clientes.detail(id))
      return data
    },
    enabled: !!id,
  })
}

export function useClienteHistorial(id: number) {
  return useQuery({
    queryKey: ["clientes", id, "pedidos"],
    queryFn: async () => {
      const { data } = await api.get<PedidoResumen[]>(API_ROUTES.clientes.pedidos(id))
      return data
    },
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<Cliente, "id" | "created_at" | "updated_at">) =>
      api.post<Cliente>(API_ROUTES.clientes.list, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] })
      toast.success("Cliente creado")
    },
    onError: () => toast.error("Error al crear el cliente"),
  })
}

export function useUpdateCliente(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Cliente>) =>
      api.patch<Cliente>(API_ROUTES.clientes.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] })
      toast.success("Cliente actualizado")
    },
    onError: () => toast.error("Error al actualizar el cliente"),
  })
}

export function useDeleteCliente(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(API_ROUTES.clientes.detail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] })
      toast.success("Cliente eliminado")
    },
    onError: () => toast.error("Error al eliminar el cliente"),
  })
}
