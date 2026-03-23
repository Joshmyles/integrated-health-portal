import { NextResponse } from "next/server";
import { getPortalNavigation } from "@/src/features/portal/lib/portal-data";

export async function GET() {
  return NextResponse.json(getPortalNavigation());
}
