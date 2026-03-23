import { redirect } from "next/navigation";
import { LoginPage } from "@/src/features/auth/components/login-page";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function LoginRoute() {
  const session = await readPortalSession();

  if (session) {
    redirect("/");
  }

  return <LoginPage />;
}
