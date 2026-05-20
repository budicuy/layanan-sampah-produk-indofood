import { type NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE_NAME, verifyJwt } from "@/app/login/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isProtected =
    pathname.startsWith("/dashboard-admin") ||
    pathname.startsWith("/dashboard-konsumen") ||
    pathname.startsWith("/dashboard-bank-sampah");
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
    let target = "/dashboard-admin";
    if (payload.role === "KONSUMEN") {
      target = "/dashboard-konsumen";
    } else if (payload.role === "BANK_SAMPAH") {
      target = "/dashboard-bank-sampah";
    }
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Role-based access control
  if (pathname.startsWith("/dashboard-admin")) {
    if (payload.role !== "ADMIN" && payload.role !== "HRD") {
      const target =
        payload.role === "KONSUMEN"
          ? "/dashboard-konsumen"
          : "/dashboard-bank-sampah";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  if (pathname.startsWith("/dashboard-konsumen")) {
    if (payload.role !== "KONSUMEN") {
      const target =
        payload.role === "BANK_SAMPAH"
          ? "/dashboard-bank-sampah"
          : "/dashboard-admin";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  if (pathname.startsWith("/dashboard-bank-sampah")) {
    if (payload.role !== "BANK_SAMPAH") {
      const target =
        payload.role === "KONSUMEN"
          ? "/dashboard-konsumen"
          : "/dashboard-admin";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard-admin/:path*",
    "/dashboard-konsumen/:path*",
    "/dashboard-bank-sampah/:path*",
    "/login",
  ],
};
