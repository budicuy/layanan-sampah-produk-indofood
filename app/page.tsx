import { redirect } from "next/navigation";
import LandingPage from "@/app/LandingPage";
import { getSession } from "@/app/login/auth/session";

/**
 * Root page — Server Component.
 * If the user is already authenticated, redirect immediately to their dashboard.
 * Otherwise, render the public landing page.
 */
export default async function Home() {
  const session = await getSession();

  if (session) {
    const { role } = session.user;
    if (role === "KONSUMEN") redirect("/dashboard-konsumen");
    if (role === "BANK_SAMPAH") redirect("/dashboard-bank-sampah");
    redirect("/dashboard-admin");
  }

  return <LandingPage />;
}
