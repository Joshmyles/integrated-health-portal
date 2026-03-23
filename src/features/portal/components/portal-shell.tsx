"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLogout } from "@/src/features/auth/hooks/use-logout";
import { AuthRequestError } from "@/src/features/auth/lib/auth-client";
import { ContentPanel } from "@/src/features/portal/components/content-panel";
import { NavigationTree } from "@/src/features/portal/components/navigation-tree";
import { usePortalContent } from "@/src/features/portal/hooks/use-portal-content";
import { usePortalNavigation } from "@/src/features/portal/hooks/use-portal-navigation";
import { collectExpandedGroupIds, hasNode } from "@/src/features/portal/lib/tree-utils";
import styles from "./portal-shell.module.css";

const FALLBACK_NODE_ID = "home";

interface PortalShellProps {
  username: string;
}

export function PortalShell({ username }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isRoutingOut, startLogoutTransition] = useTransition();
  const logoutMutation = useLogout();
  const logoutError =
    logoutMutation.error instanceof AuthRequestError
      ? logoutMutation.error.message
      : logoutMutation.error
        ? "The session could not be closed cleanly. Please try again."
        : null;

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

  async function handleLogout() {
    logoutMutation.reset();

    try {
      await logoutMutation.mutateAsync();
      startLogoutTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch {
      return;
    }
  }

  return (
    <main className={styles.pageFrame}>
      <section className={styles.desktopWindow}>
        <header className={styles.titleBar}>
          <span className={styles.titleBarTitle}>
            {navigationQuery.data?.applicationTitle ?? "MoH Uganda: National Health Portal - Main"}
          </span>
          <div className={styles.titleBarMeta}>
            <span className={styles.sessionLabel}>Signed in as {username}</span>
            <button
              className={styles.logoutButton}
              disabled={logoutMutation.isPending || isRoutingOut}
              onClick={handleLogout}
              type="button"
            >
              <span className={styles.logoutIcon} aria-hidden="true">
                <svg fill="none" height="16" viewBox="0 0 20 20" width="16">
                  <path
                    d="M8 4.5H4.8A1.8 1.8 0 0 0 3 6.3v7.4a1.8 1.8 0 0 0 1.8 1.8H8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M11 6.2 15 10l-4 3.8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M7 10h8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.4"
                  />
                </svg>
              </span>
              <span className={styles.logoutCopy}>
                <span className={styles.logoutLabel}>
                  {logoutMutation.isPending || isRoutingOut ? "Signing out..." : "Log out"}
                </span>
                <span className={styles.logoutMeta}>Local + response session</span>
              </span>
            </button>
          </div>
        </header>

        {logoutError ? <div className={styles.sessionErrorBanner}>{logoutError}</div> : null}

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
