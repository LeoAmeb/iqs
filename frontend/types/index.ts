export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: Role | null
  is_active: boolean
  is_superuser: boolean
  avatar: string | null
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  slug: string
  description: string
  permissions: Permission[]
  users_count: number
  created_at: string
  updated_at: string
}

export interface CurrentUser extends User {
  /** Codenames granted by the user's role, or ["*"] for superusers. */
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
  roles_count: number
  recent_activity: AuditLog[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
