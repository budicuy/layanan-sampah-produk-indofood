import { NextResponse } from "next/server";
import { getSession } from "@/app/login/auth/session";

/**
 * GET /api/dashboard
 * Returns the appropriate dashboard URL based on the authenticated user's role.
 * Used by PwaGate to perform a client-side redirect on PWA startup.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ url: "/login" });
  }

  const { role } = session.user;

  if (role === "KONSUMEN") {
    return NextResponse.json({ url: "/dashboard-konsumen" });
  }
  if (role === "BANK_SAMPAH") {
    return NextResponse.json({ url: "/dashboard-bank-sampah" });
  }

  return NextResponse.json({ url: "/dashboard-admin" });
}
