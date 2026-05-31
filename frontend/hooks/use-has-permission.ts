import { useCurrentUser } from "@/hooks/use-current-user"
import type { Permission } from "@/lib/permissions"

export function useHasPermission(...codenames: Permission[]): boolean {
  const { data: me } = useCurrentUser()
  const perms = me?.permissions ?? []
  if (perms.includes("*")) return true
  return codenames.every((c) => perms.includes(c))
}
