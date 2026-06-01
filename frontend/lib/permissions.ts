export const PERMISSIONS = {
  DASHBOARD: {
    VIEW: "dashboard.view_dashboard",
  },
  USERS: {
    VIEW: "users.view_user",
    CREATE: "users.add_user",
    EDIT: "users.change_user",
    DELETE: "users.delete_user",
  },
  GRUPOS: {
    VIEW: "auth.view_group",
    CREATE: "auth.add_group",
    EDIT: "auth.change_group",
    DELETE: "auth.delete_group",
  },
  AUDIT: {
    VIEW: "audit.view_auditlog",
  },
  CLIENTES: {
    VIEW: "clientes.view_cliente",
    CREATE: "clientes.add_cliente",
    EDIT: "clientes.change_cliente",
    DELETE: "clientes.delete_cliente",
  },
  PRODUCTOS: {
    VIEW: "productos.view_producto",
    CREATE: "productos.add_producto",
    EDIT: "productos.change_producto",
    DELETE: "productos.delete_producto",
  },
  CATEGORIAS: {
    VIEW: "productos.view_categoria",
    EDIT: "productos.change_categoria",
  },
  COTIZACIONES: {
    VIEW: "ventas.view_cotizacion",
    CREATE: "ventas.add_cotizacion",
  },
  PEDIDOS: {
    VIEW: "ventas.view_pedido",
    EDIT: "ventas.change_pedido",
    DELETE: "ventas.delete_pedido",
  },
  PRODUCCION: {
    VIEW: "ventas.view_pedidoitem",
    EDIT: "ventas.change_pedidoitem",
  },
} as const

type ResourcePerms<T> = T extends Record<string, string> ? T[keyof T] : never
export type Permission = ResourcePerms<typeof PERMISSIONS[keyof typeof PERMISSIONS]>
