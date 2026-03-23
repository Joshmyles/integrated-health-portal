import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import type { VhfPatientsResponse } from "@/src/features/cif/types/cif";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

export async function GET() {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  try {
    const response = await requestResponseHealth<VhfPatientsResponse>("/api/vhf/patients");
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The VHF patient list could not be loaded right now." },
      { status: 502 }
    );
  }
}
