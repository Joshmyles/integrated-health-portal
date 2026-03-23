"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ContentPanel } from "@/src/features/portal/components/content-panel";
import { NavigationTree } from "@/src/features/portal/components/navigation-tree";
import { usePortalContent } from "@/src/features/portal/hooks/use-portal-content";
import { usePortalNavigation } from "@/src/features/portal/hooks/use-portal-navigation";
import { collectExpandedGroupIds, hasNode } from "@/src/features/portal/lib/tree-utils";
import styles from "./portal-shell.module.css";

const FALLBACK_NODE_ID = "home";

export function PortalShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const selectedNodeId = searchParams.get("node") ?? FALLBACK_NODE_ID;

  const navigationQuery = usePortalNavigation();
  const contentQuery = usePortalContent(selectedNodeId);

  useEffect(() => {
    if (!navigationQuery.data) {
      return;
    }

    if (selectedNodeId !== FALLBACK_NODE_ID && !hasNode(navigationQuery.data.tree, selectedNodeId)) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("node");
      router.replace(
        params.size ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false }
      );
      return;
    }

    const requiredIds =
      selectedNodeId === FALLBACK_NODE_ID
        ? collectExpandedGroupIds(navigationQuery.data.tree, "outbreak-management")
        : collectExpandedGroupIds(navigationQuery.data.tree, selectedNodeId);

    setExpandedIds((current) => {
      if (!current.length) {
        return requiredIds;
      }

      const merged = Array.from(new Set([...current, ...requiredIds]));

      if (
        merged.length === current.length &&
        merged.every((value, index) => value === current[index])
      ) {
        return current;
      }

      return merged;
    });
  }, [navigationQuery.data, pathname, router, searchParams, selectedNodeId]);

  function updateSelectedNode(nodeId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nodeId === FALLBACK_NODE_ID) {
      params.delete("node");
    } else {
      params.set("node", nodeId);
    }

    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false
    });
  }

  function toggleNode(nodeId: string) {
    setExpandedIds((current) =>
      current.includes(nodeId)
        ? current.filter((value) => value !== nodeId)
        : [...current, nodeId]
    );
  }

  return (
    <main className={styles.pageFrame}>
      <section className={styles.desktopWindow}>
        <header className={styles.titleBar}>
          <span>{navigationQuery.data?.applicationTitle ?? "MoH Uganda: National Health Portal - Main"}</span>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>Function Menu</div>

            <div className={styles.sidebarBody}>
              {navigationQuery.isLoading ? (
                <div className={styles.sidebarNotice}>Loading navigation tree...</div>
              ) : null}

              {navigationQuery.isError ? (
                <div className={styles.sidebarNotice}>
                  The function menu could not be loaded.
                </div>
              ) : null}

              {navigationQuery.data ? (
                <NavigationTree
                  expandedIds={expandedIds}
                  onSelect={updateSelectedNode}
                  onToggle={toggleNode}
                  selectedId={selectedNodeId}
                  tree={navigationQuery.data.tree}
                />
              ) : null}
            </div>
          </aside>

          <div aria-hidden="true" className={styles.workspaceDivider} />

          <section className={styles.contentWorkspace}>
            <ContentPanel
              content={contentQuery.data}
              isError={contentQuery.isError}
              isLoading={contentQuery.isLoading}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
