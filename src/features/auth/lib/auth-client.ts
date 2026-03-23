export interface LoginCredentials {
  password: string;
  username: string;
}

export interface LoginResult {
  message?: string;
  user?: {
    username: string;
  };
}

export interface LogoutResult {
  message?: string;
}

interface ErrorPayload {
  message?: string;
}

export class AuthRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthRequestError";
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

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const payload = await readJson<T & ErrorPayload>(response);

  if (!response.ok) {
    throw new AuthRequestError(
      payload?.message ?? "The request could not be completed.",
      response.status
    );
  }

  return (payload ?? {}) as T;
}

export function login(credentials: LoginCredentials) {
  return requestJson<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function logout() {
  return requestJson<LogoutResult>("/api/auth/logout", {
    method: "POST"
  });
}
