import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { getSession, signOut } from "next-auth/react"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
})

// Attach access token from session
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (v: string) => void
  reject: (e: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  )
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as unknown as Record<string, unknown> & typeof error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
          }
          return api.request(originalRequest as InternalAxiosRequestConfig)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const session = await getSession()
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/token/refresh/`,
          { refresh: session?.refreshToken }
        )
        const newToken = res.data.access as string
        processQueue(null, newToken)
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`
        }
        return api.request(originalRequest as InternalAxiosRequestConfig)
      } catch (err) {
        processQueue(err, null)
        await signOut({ callbackUrl: "/login" })
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
