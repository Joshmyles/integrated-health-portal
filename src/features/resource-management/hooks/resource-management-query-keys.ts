export const resourceManagementQueryKeys = {
  requisitions: () => ["resource-management", "requisitions"] as const,
  legacyPillars: () => ["resource-management", "pillars", "legacy"] as const,
  pillars: () => ["resource-management", "pillars", "list"] as const,
  resources: () => ["resource-management", "resources", "list"] as const
};
