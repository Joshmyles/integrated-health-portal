import type {
  PortalNavigationResponse,
  PortalPageContent
} from "@/src/features/portal/types/portal";

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchPortalNavigation() {
  return requestJson<PortalNavigationResponse>("/api/portal/navigation");
}

export function fetchPortalContent(nodeId: string) {
  return requestJson<PortalPageContent>(`/api/portal/content/${encodeURIComponent(nodeId)}`);
}
