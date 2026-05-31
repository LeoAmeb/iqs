import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import type { JWT } from "next-auth/jwt"

// Server-side fetches (authorize, token refresh) must use the internal Docker
// hostname. NEXT_PUBLIC_API_URL is for browser calls only.
const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1"

// Access tokens live 15 minutes on the Django backend.
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000

async function refreshDjangoToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token.refreshToken }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return {
      ...token,
      accessToken: data.access,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
      error: undefined,
    }
  } catch {
    // Signal the session/middleware that the refresh failed.
    return { ...token, error: "RefreshTokenError" as const }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API_URL}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          if (!res.ok) return null
          const data = await res.json()
          return {
            id: String(data.user.id),
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            accessToken: data.access,
            refreshToken: data.refresh,
            user: data.user,
          }
        } catch {
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          authorization: { params: { access_type: "offline", prompt: "consent" } },
        })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // ── Initial credentials sign-in ──────────────────────────────────────
      if (user) {
        return {
          ...token,
          accessToken: (user as Record<string, unknown>).accessToken as string,
          refreshToken: (user as Record<string, unknown>).refreshToken as string,
          accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
          userData: (user as Record<string, unknown>).user,
        }
      }

      // ── OAuth sign-in: exchange provider token for Django JWT ────────────
      if (account && (account.provider === "google" || account.provider === "github")) {
        try {
          const res = await fetch(`${API_URL}/auth/${account.provider}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: account.access_token }),
          })
          if (res.ok) {
            const data = await res.json()
            return {
              ...token,
              accessToken: data.access,
              refreshToken: data.refresh,
              accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
              userData: data.user,
            }
          }
        } catch {
          return { ...token, error: "RefreshTokenError" as const }
        }
      }

      // ── Subsequent calls: return token if still valid ────────────────────
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // ── Token expired: attempt silent refresh ────────────────────────────
      return refreshDjangoToken(token)
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      // Propagate refresh errors so middleware and client can react.
      session.error = token.error as "RefreshTokenError" | undefined
      session.user = {
        ...session.user,
        ...(token.userData as unknown as Record<string, unknown>),
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
})
