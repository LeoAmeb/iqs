import { keepPreviousData, useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { VentasSerieResponse } from "@/types"

interface VentasSerieParams {
  desde: string
  hasta: string
}

export function useVentasSerie(params: VentasSerieParams) {
  return useQuery({
    queryKey: ["dashboard", "ventas-serie", params],
    queryFn: async () => {
      const { data } = await api.get<VentasSerieResponse>(API_ROUTES.dashboard.ventasSerie, { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}
