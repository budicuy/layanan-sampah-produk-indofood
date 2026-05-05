import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/konsumen");
  const isAuthPage = pathname === "/login";

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  try {
    // We use a direct fetch to the session endpoint to avoid Edge compatibility issues with Prisma
    // This is the safest way to get the session and role in a proxy/middleware environment
    const sessionResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/get-session`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      },
    );

    let session = null;
    if (sessionResponse.ok) {
      session = await sessionResponse.json().catch(() => null);
    }

    // Redirect to login if not authenticated and trying to access protected routes
    if (!session?.user) {
      if (isProtected) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    // If authenticated, prevent access to login page
    if (isAuthPage) {
      const target =
        session.user.role === "KONSUMEN" ? "/konsumen" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }

    // Role-based access control
    if (pathname.startsWith("/dashboard") && session.user.role === "KONSUMEN") {
      return NextResponse.redirect(new URL("/konsumen", request.url));
    }

    if (pathname.startsWith("/konsumen") && session.user.role !== "KONSUMEN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy Auth Error:", error);
    // On error, allow request to proceed to avoid breaking the app.
    // Layout-level guards provide secondary security.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/konsumen/:path*", "/login"],
};
