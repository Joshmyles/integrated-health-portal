export const portalQueryKeys = {
  navigation: ["portal", "navigation"] as const,
  content: (nodeId: string) => ["portal", "content", nodeId] as const
};
