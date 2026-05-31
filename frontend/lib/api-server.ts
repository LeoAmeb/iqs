/**
 * Server-side API client for use in Server Components and Route Handlers.
 * Uses native fetch (no Axios) since Axios only runs on the client.
 * Automatically attaches the session access token.
 */
import { auth } from "@/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** Pass false to skip auth header (e.g. for public endpoints). */
  withAuth?: boolean
}

export async function serverFetch<T>(
  path: string,
  { body, withAuth = true, ...options }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers ?? {}) as Record<string, string>),
  }

  if (withAuth) {
    const session = await auth()
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Always dynamic — admin data must never be served stale.
    cache: "no-store",
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail ?? `API error ${res.status}`)
  }

  return res.json() as Promise<T>
}
