interface ErrorPayload {
  message?: string;
}

export interface UpdateRrtTeamPayload {
  base_location?: string;
  is_active: boolean;
  specializations: string[];
  team_code: string;
  team_lead_email?: string;
  team_lead_name: string;
  team_lead_phone?: string;
  team_name: string;
  team_size: number;
  team_type: string;
}

export type CreateRrtTeamPayload = UpdateRrtTeamPayload;

export class RrtTeamRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RrtTeamRequestError";
    this.status = status;
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = await readJson<T & ErrorPayload>(response);

  if (!response.ok) {
    throw new RrtTeamRequestError(
      payload?.message ?? "The RRT team request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export function deleteRrtTeam(teamId: number) {
  return requestJson<{ message?: string }>(`/api/rrt-teams/${teamId}`, {
    method: "DELETE"
  });
}

export function createRrtTeam(payload: CreateRrtTeamPayload) {
  return requestJson<{ message?: string }>(`/api/rrt-teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function updateRrtTeam(teamId: number, payload: UpdateRrtTeamPayload) {
  return requestJson<{ message?: string }>(`/api/rrt-teams/${teamId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
