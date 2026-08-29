export const API_ROUTES = {
  users: {
    list: "/users/",
    detail: (id: number | string) => `/users/${id}/`,
    me: "/users/me/",
  },
  grupos: {
    list: "/grupos/",
    detail: (id: number | string) => `/grupos/${id}/`,
  },
  permisos: {
    list: "/permisos/",
  },
  audit: {
    list: "/audit/",
  },
  dashboard: {
    stats: "/dashboard/stats/",
    ventasSerie: "/dashboard/ventas-serie/",
    celeryPing: "/dashboard/celery-ping/",
  },
  clientes: {
    list: "/clientes/",
    detail: (id: number | string) => `/clientes/${id}/`,
    pedidos: (id: number | string) => `/clientes/${id}/pedidos/`,
  },
  categorias: {
    list: "/categorias/",
    detail: (id: number | string) => `/categorias/${id}/`,
    restablecer: (id: number | string) => `/categorias/${id}/restablecer/`,
  },
  productos: {
    list: "/productos/",
    detail: (id: number | string) => `/productos/${id}/`,
    cotizador: "/productos/cotizador/",
    configuracion: "/productos/configuracion/",
  },
  cotizaciones: {
    list: "/cotizaciones/",
    detail: (id: number | string) => `/cotizaciones/${id}/`,
    proceder: (id: number | string) => `/cotizaciones/${id}/proceder/`,
  },
  cotizacionItems: {
    detail: (id: number | string) => `/cotizacion-items/${id}/`,
  },
  pedidos: {
    list: "/pedidos/",
    detail: (id: number | string) => `/pedidos/${id}/`,
  },
  produccion: {
    list: "/produccion/",
    detail: (id: number | string) => `/produccion/${id}/`,
  },
} as const
