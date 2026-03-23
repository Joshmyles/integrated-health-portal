import type { PortalTreeNode } from "@/src/features/portal/types/portal";

function walkTree(
  nodes: PortalTreeNode[],
  targetId: string,
  trail: PortalTreeNode[]
): PortalTreeNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];

    if (node.id === targetId) {
      return nextTrail;
    }

    if (node.children?.length) {
      const match = walkTree(node.children, targetId, nextTrail);

      if (match.length) {
        return match;
      }
    }
  }

  return [];
}

export function findNodePath(nodes: PortalTreeNode[], targetId: string) {
  return walkTree(nodes, targetId, []);
}

export function hasNode(nodes: PortalTreeNode[], targetId: string) {
  return findNodePath(nodes, targetId).length > 0;
}

export function collectExpandedGroupIds(nodes: PortalTreeNode[], targetId: string) {
  const defaultGroups = nodes
    .filter((node) => Boolean(node.children?.length))
    .slice(0, 3)
    .map((node) => node.id);
  const activeGroups = findNodePath(nodes, targetId)
    .filter((node) => Boolean(node.children?.length))
    .map((node) => node.id);

  return Array.from(new Set([...defaultGroups, ...activeGroups]));
}
