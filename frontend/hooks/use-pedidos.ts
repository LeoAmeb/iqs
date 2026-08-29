import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type {
  Cotizacion,
  CotizacionResumen,
  EstatusPedido,
  PaginatedResponse,
  Pedido,
  PedidoResumen,
} from "@/types"

interface PedidosParams {
  page?: number
  search?: string
  estatus?: EstatusPedido
  todos?: "1"
  pendientes?: "1"
  entrega?: "hoy" | "semana" | "vencido"
  ordering?: string
  page_size?: number
}

export function usePedidos(params?: PedidosParams) {
  return useQuery({
    queryKey: ["pedidos", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PedidoResumen>>(API_ROUTES.pedidos.list, { params })
      return data
    },
  })
}

export function usePedido(id: number) {
  return useQuery({
    queryKey: ["pedidos", id],
    queryFn: async () => {
      const { data } = await api.get<Pedido>(API_ROUTES.pedidos.detail(id))
      return data
    },
    enabled: !!id,
  })
}

export function useUpdatePedido(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Pick<Pedido, "estatus" | "nombre_cliente" | "telefono" | "fecha_entrega" | "hora_entrega" | "anticipo" | "forma_pago" | "notas">>) =>
      api.patch<Pedido>(API_ROUTES.pedidos.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] })
      toast.success("Pedido actualizado")
    },
    onError: () => toast.error("Error al actualizar el pedido"),
  })
}

export function useDeletePedido(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(API_ROUTES.pedidos.detail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pedidos"] })
      toast.success("Pedido eliminado")
    },
    onError: () => toast.error("Error al eliminar el pedido"),
  })
}

// ─── Cotizaciones ────────────────────────────────────────────────────────────

interface CotizacionesParams {
  page?: number
  search?: string
  page_size?: number
}

export function useCotizaciones(params?: CotizacionesParams) {
  return useQuery({
    queryKey: ["cotizaciones", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CotizacionResumen>>(API_ROUTES.cotizaciones.list, { params })
      return data
    },
  })
}

export function useCotizacion(id: number) {
  return useQuery({
    queryKey: ["cotizaciones", id],
    queryFn: async () => {
      const { data } = await api.get<Cotizacion>(API_ROUTES.cotizaciones.detail(id))
      return data
    },
    enabled: !!id,
  })
}

interface CotizacionItemUpdatePayload {
  nombre_producto?: string
  descripcion?: string
  cantidad?: number
  precio_unit?: number
  total?: number
  iva_pct?: number
  iva?: number
  costo?: number
  ganancia?: number
  margen?: number
  detalles?: Record<string, unknown>
}

export function useProcederCotizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cotizacionId: number) =>
      api.post<Pedido>(API_ROUTES.cotizaciones.proceder(cotizacionId)).then((r) => r.data),
    onSuccess: (pedido) => {
      qc.invalidateQueries({ queryKey: ["cotizaciones"] })
      qc.invalidateQueries({ queryKey: ["pedidos"] })
      toast.success(`Pedido #${String(pedido.folio).padStart(4, "0")} generado`)
    },
    onError: () => toast.error("Error al generar el pedido"),
  })
}

export function useUpdateCotizacionItem(cotizacionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: CotizacionItemUpdatePayload }) =>
      api.patch(API_ROUTES.cotizacionItems.detail(itemId), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cotizaciones", cotizacionId] })
      toast.success("Ítem actualizado")
    },
    onError: () => toast.error("Error al actualizar el ítem"),
  })
}

// ─────────────────────────────────────────────────────────────────────────────

interface CotizacionItemPayload {
  categoria_id?: number | null
  nombre_producto: string
  tipo_calculo: string
  descripcion: string
  cantidad: number
  precio_unit: number
  total: number
  iva_pct: number
  iva: number
  costo: number
  ganancia: number
  margen: number
  detalles: Record<string, unknown>
}

interface CotizacionPayload {
  cliente_id?: number | null
  nombre_cliente?: string
  telefono?: string
  email?: string
  fecha_entrega?: string | null
  hora_entrega?: string | null
  anticipo?: number
  forma_pago?: string
  notas?: string
  total: number
  costo: number
  iva: number
  ganancia: number
  margen: number
  items: CotizacionItemPayload[]
}

export function useCrearCotizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CotizacionPayload) =>
      api.post<Cotizacion>(API_ROUTES.cotizaciones.list, payload).then((r) => r.data),
    onSuccess: (cotizacion) => {
      qc.invalidateQueries({ queryKey: ["pedidos"] })
      qc.invalidateQueries({ queryKey: ["clientes"] })
      toast.success(`Cotización #${String(cotizacion.folio).padStart(4, "0")} creada`)
    },
    onError: (error) => {
      const errores = axios.isAxiosError(error) ? error.response?.data?.errors : undefined
      const detalle = errores
        ? Object.values(errores as Record<string, string[]>).flat().join(" ")
        : ""
      toast.error(detalle || "Error al crear la cotización")
    },
  })
}
