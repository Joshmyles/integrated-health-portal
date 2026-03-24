import { NextResponse } from "next/server";
import { readPortalSession } from "@/src/features/auth/lib/auth-session";
import {
  requestResponseHealth,
  ResponseHealthApiError
} from "@/src/features/users/lib/users-server";

function parseEmployeeId(value: string) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ employeeId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { employeeId } = await context.params;
  const parsedEmployeeId = parseEmployeeId(employeeId);

  if (!parsedEmployeeId) {
    return NextResponse.json({ message: "A valid employee ID is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/employees/${parsedEmployeeId}`);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The employee record could not be loaded right now." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ employeeId: string }> }
) {
  if (!(await readPortalSession())) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { employeeId } = await context.params;
  const parsedEmployeeId = parseEmployeeId(employeeId);

  if (!parsedEmployeeId) {
    return NextResponse.json({ message: "A valid employee ID is required." }, { status: 400 });
  }

  try {
    const response = await requestResponseHealth<unknown>(`/api/employees/${parsedEmployeeId}`, {
      method: "DELETE"
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseHealthApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "The employee could not be deleted right now." },
      { status: 502 }
    );
  }
}
