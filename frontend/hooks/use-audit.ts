import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { AuditLog, PaginatedResponse } from "@/types"

interface AuditParams {
  page?: number
  action?: string
  date_from?: string
  date_to?: string
  page_size?: number
}

export function useAuditLogs(params?: AuditParams) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AuditLog>>(
        API_ROUTES.audit.list,
        { params }
      )
      return data
    },
  })
}
