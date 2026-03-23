import { redirect } from "next/navigation";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import { PortalShell } from "@/src/features/portal/components/portal-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await readPortalSession();

  if (!session) {
    redirect("/login");
  }

  return <PortalShell username={session.username} />;
}
