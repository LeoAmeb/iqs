export interface GrupoMinimal {
  id: number
  name: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  groups: GrupoMinimal[]
  is_active: boolean
  is_superuser: boolean
  avatar: string | null
  created_at: string
  updated_at: string
}

export interface Grupo {
  id: number
  name: string
  permissions: Permission[]
  users_count: number
}

export interface CurrentUser extends User {
  /** Permisos en formato 'app_label.codename', o ["*"] para superusuarios. */
  permissions: string[]
}

export interface Permission {
  id: number
  codename: string
  name: string
  category: string
}

export interface AuditLog {
  id: number
  user: Pick<User, "id" | "email" | "first_name" | "last_name"> | null
  action: "create" | "update" | "delete" | "login" | "logout"
  resource_type: string
  resource_id: string
  ip_address: string | null
  user_agent: string
  extra_data: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  total_users: number
  active_users: number
  new_users_30d: number
  grupos_count: number
  recent_activity: AuditLog[]
}

export interface DashboardIQS {
  periodo: { inicio: string; hoy: string }
  ventas: number
  costos: number
  iva: number
  ganancia: number
  margen: number
  meta_mensual: number
  avance_meta_pct: number
  pedidos_activos: number
  entregas_proximas_48h: number
  saldo_pendiente: number
  top_productos: { nombre_producto: string; total_ventas: number }[]
  pagos_por_forma: { forma_pago: string; forma_pago_label: string; monto: number }[]
}

export interface VentaSerieItem {
  periodo: string
  ventas: number
  costos: number
  ganancia: number
}

export interface VentasSerieResponse {
  desde: string
  hasta: string
  agrupacion: "dia" | "mes"
  serie: VentaSerieItem[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export interface Cliente {
  id: number
  nombre: string
  telefono: string
  email: string
  notas: string
  created_at: string
  updated_at: string
}

// ─── Productos ───────────────────────────────────────────────────────────────

export type TipoCalculo =
  | "precio_fijo"
  | "por_dimension"
  | "tabla_tiered"
  | "por_hora"
  | "manual"

export interface Categoria {
  id: number
  nombre: string
  icono: string
  orden: number
  activo: boolean
  tipo_calculo: TipoCalculo
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CategoriaPayload {
  nombre: string
  icono: string
  orden: number
  activo: boolean
  tipo_calculo: TipoCalculo
  config: Record<string, unknown>
}

export interface Producto {
  id: number
  nombre: string
  tipo_calculo: TipoCalculo
  categoria: Categoria | null
  icono: string
  config: Record<string, unknown>
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface ProductoPayload {
  nombre: string
  tipo_calculo: TipoCalculo
  categoria: number | null
  icono: string
  config: Record<string, unknown>
  activo: boolean
  orden: number
}

export interface ConfiguracionSistema {
  hora_objetivo: number
  hora_laser: number
  meta_mensual: number
}

export interface CotizadorConfig {
  categorias: Categoria[]
  configuracion: ConfiguracionSistema
}

// ─── Ventas ──────────────────────────────────────────────────────────────────

export type FormaPago = "efectivo" | "transferencia" | "tarjeta" | ""

export type EstatusPedido =
  | "pendiente"
  | "proximo"
  | "urgente"
  | "en_produccion"
  | "listo"
  | "entregado"
  | "cancelado"

export type EstatusProduccion =
  | "pendiente"
  | "en_produccion"
  | "listo"
  | "entregado"

export interface PedidoItemLog {
  id: number
  estatus_anterior: EstatusProduccion
  estatus_nuevo: EstatusProduccion
  nota: string
  usuario_nombre: string
  created_at: string
}

export interface PedidoItem {
  id: number
  producto: number | null
  nombre_producto: string
  tipo_calculo: TipoCalculo
  descripcion: string
  cantidad: number
  precio_unit: string
  total: string
  costo: string
  detalles: Record<string, unknown>
  estatus_produccion: EstatusProduccion
  logs: PedidoItemLog[]
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: number
  folio: number
  cotizacion: number
  cliente: number | null
  nombre_cliente: string
  telefono: string
  fecha_entrega: string | null
  hora_entrega: string | null
  anticipo: string
  forma_pago: FormaPago
  notas: string
  estatus: EstatusPedido
  total: string
  costo: string
  creado_por: number | null
  creado_por_nombre: string
  deleted_at: string | null
  items: PedidoItem[]
  created_at: string
  updated_at: string
}

export interface PedidoResumen extends Omit<Pedido, "items"> {}

export interface CotizacionResumen {
  id: number
  folio: number
  cliente: number | null
  nombre_cliente: string
  telefono: string
  fecha_entrega: string | null
  anticipo: string
  forma_pago: FormaPago
  total: string
  costo: string
  iva: string
  ganancia: string
  margen: string
  creado_por_nombre: string
  pedido_id: number | null
  items_count: number
  created_at: string
}

export interface CotizacionItem {
  id: number
  categoria: number | null
  nombre_producto: string
  tipo_calculo: TipoCalculo
  descripcion: string
  cantidad: number
  precio_unit: string
  total: string
  iva_pct: string
  iva: string
  costo: string
  ganancia: string
  margen: string
  detalles: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Cotizacion {
  id: number
  folio: number
  cliente: number | null
  nombre_cliente: string
  telefono: string
  email: string
  fecha_entrega: string | null
  hora_entrega: string | null
  anticipo: string
  forma_pago: FormaPago
  notas: string
  total: string
  costo: string
  iva: string
  ganancia: string
  margen: string
  creado_por: number | null
  creado_por_nombre: string
  pedido_id: number | null
  items: CotizacionItem[]
  created_at: string
  updated_at: string
}

export interface ProduccionItem {
  id: number
  folio_pedido: number
  nombre_cliente: string
  fecha_entrega: string | null
  nombre_producto: string
  tipo_calculo: TipoCalculo
  descripcion: string
  cantidad: number
  precio_unit: string
  total: string
  estatus_produccion: EstatusProduccion
  created_at: string
  updated_at: string
}

// ─── Cotizador (solo local, no persiste en BD) ───────────────────────────────

export interface CarritoItem {
  /** UUID generado en cliente para identificar el ítem en el carrito */
  _id: string
  categoria_id: number | null
  nombre_producto: string
  tipo_calculo: TipoCalculo
  descripcion: string
  cantidad: number
  precio_unit: number
  total: number
  iva_pct: number
  iva: number
  costo: number
  ganancia: number
  margen: number
  /** % de descuento manual aplicado sobre precio_unit (0-100) */
  descuento_pct?: number
  /** inputs del formulario + config_snapshot de la categoría */
  detalles: Record<string, unknown>
}
