import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { API_ROUTES } from "@/lib/api-routes"
import type { CurrentUser } from "@/types"

export function useCurrentUser() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ["me", session?.user?.email],
    queryFn: async () => {
      const { data } = await api.get<CurrentUser>(API_ROUTES.users.me)
      return data
    },
    staleTime: 30 * 1000,
    enabled: !!session,
  })
}
