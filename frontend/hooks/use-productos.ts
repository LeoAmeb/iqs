import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type {
  Categoria,
  CategoriaPayload,
  ConfiguracionSistema,
  CotizadorConfig,
  PaginatedResponse,
  Producto,
  ProductoPayload,
} from "@/types"

// ─── Categorías ───────────────────────────────────────────────────────────────

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Categoria>>(API_ROUTES.categorias.list, {
        params: { page_size: 100, ordering: "orden,nombre" },
      })
      return data
    },
  })
}

export function useCreateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoriaPayload) =>
      api.post<Categoria>(API_ROUTES.categorias.list, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Categoría creada")
    },
    onError: () => toast.error("Error al crear la categoría"),
  })
}

export function useUpdateCategoria(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CategoriaPayload>) =>
      api.patch<Categoria>(API_ROUTES.categorias.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] })
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Categoría actualizada")
    },
    onError: () => toast.error("Error al actualizar la categoría"),
  })
}

export function useRestablecerCategoria(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<Categoria>(API_ROUTES.categorias.restablecer(id)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Configuración restablecida al estado base")
    },
    onError: () => toast.error("No hay configuración base para esta categoría"),
  })
}

export function useDeleteCategoria(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(API_ROUTES.categorias.detail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Categoría eliminada")
    },
    onError: () => toast.error("Error al eliminar la categoría"),
  })
}

// ─── Productos ────────────────────────────────────────────────────────────────

interface ProductosParams {
  page?: number
  search?: string
  activo?: boolean
  tipo_calculo?: string
  categoria?: number
}

export function useProductos(params?: ProductosParams) {
  return useQuery({
    queryKey: ["productos", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Producto>>(API_ROUTES.productos.list, { params })
      return data
    },
  })
}

export function useCotizadorConfig() {
  return useQuery({
    queryKey: ["cotizador-config"],
    queryFn: async () => {
      const { data } = await api.get<CotizadorConfig>(API_ROUTES.productos.cotizador)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useConfiguracionSistema() {
  return useQuery({
    queryKey: ["configuracion-sistema"],
    queryFn: async () => {
      const { data } = await api.get<ConfiguracionSistema>(API_ROUTES.productos.configuracion)
      return data
    },
  })
}

export function useUpdateConfiguracionSistema() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ConfiguracionSistema>) =>
      api.patch<ConfiguracionSistema>(API_ROUTES.productos.configuracion, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracion-sistema"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Configuración actualizada")
    },
    onError: () => toast.error("Error al actualizar la configuración"),
  })
}

export function useCreateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductoPayload) =>
      api.post<Producto>(API_ROUTES.productos.list, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Producto creado")
    },
    onError: () => toast.error("Error al crear el producto"),
  })
}

export function useUpdateProducto(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ProductoPayload>) =>
      api.patch<Producto>(API_ROUTES.productos.detail(id), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Producto actualizado")
    },
    onError: () => toast.error("Error al actualizar el producto"),
  })
}

export function useDeleteProducto(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(API_ROUTES.productos.detail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["cotizador-config"] })
      toast.success("Producto eliminado")
    },
    onError: () => toast.error("Error al eliminar el producto"),
  })
}
