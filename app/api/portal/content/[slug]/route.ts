import { NextResponse } from "next/server";
import { getPortalContent } from "@/src/features/portal/lib/portal-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const page = getPortalContent(slug);

  if (!page) {
    return NextResponse.json({ message: "Portal page not found." }, { status: 404 });
  }

  return NextResponse.json(page);
}
