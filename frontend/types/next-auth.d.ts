import "next-auth"
import "next-auth/jwt"
import type { User as AppUser } from "./index"

declare module "next-auth" {
  interface Session {
    accessToken: string
    refreshToken: string
    /** Set to "RefreshTokenError" when the silent token refresh fails. */
    error?: "RefreshTokenError"
    user: AppUser & {
      name?: string | null
      image?: string | null
      /** Codenames from the user's role, or ["*"] for superusers. */
      permissions?: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    /** Unix timestamp (ms) when the access token expires. */
    accessTokenExpires?: number
    userData?: AppUser
    error?: "RefreshTokenError"
  }
}
