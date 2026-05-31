export const API_ROUTES = {
  users: {
    list: "/users/",
    detail: (id: number | string) => `/users/${id}/`,
    me: "/users/me/",
  },
  roles: {
    list: "/roles/",
    detail: (id: number | string) => `/roles/${id}/`,
  },
  permissions: {
    list: "/permissions/",
  },
  audit: {
    list: "/audit/",
  },
  dashboard: {
    stats: "/dashboard/stats/",
    celeryPing: "/dashboard/celery-ping/",
  },
} as const
