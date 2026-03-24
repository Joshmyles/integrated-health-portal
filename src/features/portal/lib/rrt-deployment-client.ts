interface ErrorPayload {
  message?: string;
}

export interface RrtDeploymentPayload {
  actual_return_date?: string;
  assigned_driver?: string;
  assigned_vehicle?: string;
  deployment_date: string;
  deployment_notes?: string;
  deployment_purpose?: string;
  deployment_status: string;
  expected_return_date?: string;
  outbreak_id: number;
  team_id: number;
}

export class RrtDeploymentRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RrtDeploymentRequestError";
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
    throw new RrtDeploymentRequestError(
      payload?.message ?? "The RRT deployment request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export function createRrtDeployment(payload: RrtDeploymentPayload) {
  return requestJson<{ message?: string }>("/api/rrt-deployments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function updateRrtDeployment(deploymentId: number, payload: RrtDeploymentPayload) {
  return requestJson<{ message?: string }>(`/api/rrt-deployments/${deploymentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function deleteRrtDeployment(deploymentId: number) {
  return requestJson<{ message?: string }>(`/api/rrt-deployments/${deploymentId}`, {
    method: "DELETE"
  });
}
