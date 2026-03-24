export const resourceManagementQueryKeys = {
  requisitions: () => ["resource-management", "requisitions"] as const,
  legacyPillars: () => ["resource-management", "pillars", "legacy"] as const,
  pillars: () => ["resource-management", "pillars", "list"] as const,
  resources: () => ["resource-management", "resources", "list"] as const,
  activityLogs: () => ["resource-management", "activity-logs", "list"] as const,
  activityLog: (id: number) => ["resource-management", "activity-logs", id] as const
};
