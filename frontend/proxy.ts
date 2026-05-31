import { auth } from "./auth"
import { NextResponse } from "next/server"

// Paths that don't require authentication. Everything else is protected.
const PUBLIC_PATHS = ["/login", "/register"]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

export default auth((req) => {
  const session = req.auth
  const isLoggedIn = !!session
  const hasTokenError = session?.error === "RefreshTokenError"

  const { pathname } = req.nextUrl

  // Force-logout when the refresh token itself has expired.
  if (isLoggedIn && hasTokenError && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("error", "SessionExpired")
    return NextResponse.redirect(loginUrl)
  }

  // Root redirect.
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", req.url)
    )
  }

  // Unauthenticated user trying to reach a protected route.
  if (!isPublic(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting a login/register page.
  if (isPublic(pathname) && isLoggedIn && !hasTokenError) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
