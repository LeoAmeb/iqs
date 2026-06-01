import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { EstatusProduccion, PaginatedResponse, ProduccionItem } from "@/types"

interface ProduccionParams {
  estatus_produccion?: EstatusProduccion
  page?: number
  page_size?: number
}

export function useProduccion(params?: ProduccionParams) {
  return useQuery({
    queryKey: ["produccion", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ProduccionItem>>(API_ROUTES.produccion.list, { params })
      return data
    },
    refetchInterval: 30_000,
  })
}

export function useActualizarEstatusProduccion(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { estatus_produccion: EstatusProduccion; nota?: string }) =>
      api.patch<ProduccionItem>(API_ROUTES.produccion.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produccion"] })
      qc.invalidateQueries({ queryKey: ["pedidos"] })
    },
    onError: () => toast.error("Error al actualizar el estatus"),
  })
}
