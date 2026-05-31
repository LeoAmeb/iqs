export const PERMISSIONS = {
  DASHBOARD: {
    VIEW: "dashboard.view",
  },
  USERS: {
    VIEW: "users.view",
    CREATE: "users.create",
    EDIT: "users.edit",
    DELETE: "users.delete",
  },
  ROLES: {
    VIEW: "roles.view",
    CREATE: "roles.create",
    EDIT: "roles.edit",
    DELETE: "roles.delete",
  },
  AUDIT: {
    VIEW: "audit.view",
  },
} as const

type ResourcePerms<T> = T extends Record<string, string> ? T[keyof T] : never
export type Permission = ResourcePerms<typeof PERMISSIONS[keyof typeof PERMISSIONS]>
