import { type NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE_NAME, verifyJwt } from "@/app/login/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isProtected =
    pathname.startsWith("/dashboard-admin") ||
    pathname.startsWith("/dashboard-konsumen");
  const isAuthPage = pathname === "/login";

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  // Read JWT directly from cookie — Edge-compatible, no Prisma needed
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  const payload = token ? await verifyJwt(token) : null;

  // Redirect to login if not authenticated and trying to access protected routes
  if (!payload) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // If authenticated, prevent access to login page
  if (isAuthPage) {
    const target =
      payload.role === "KONSUMEN" ? "/dashboard-konsumen" : "/dashboard-admin";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Role-based access control
  if (pathname.startsWith("/dashboard-admin") && payload.role === "KONSUMEN") {
    return NextResponse.redirect(new URL("/dashboard-konsumen", request.url));
  }

  if (
    pathname.startsWith("/dashboard-konsumen") &&
    payload.role !== "KONSUMEN"
  ) {
    return NextResponse.redirect(new URL("/dashboard-admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard-admin/:path*", "/dashboard-konsumen/:path*", "/login"],
};
