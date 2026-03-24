import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import { getPortalContent } from "@/src/features/portal/lib/portal-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { slug } = await context.params;
  const page = await getPortalContent(slug);

  if (!page) {
    return NextResponse.json({ message: "Portal page not found." }, { status: 404 });
  }

  return NextResponse.json(page);
}
