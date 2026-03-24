"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
    setUserMenuOpen(false);

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

  function handleOpenSettings() {
    setUserMenuOpen(false);
    updateSelectedNode("system-settings");
  }

  // Close user menu on outside click
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  return (
    <main className={styles.pageFrame}>
      <section className={styles.desktopWindow}>
        <header className={styles.titleBar}>
          <span className={styles.titleBarTitle}>
            {navigationQuery.data?.applicationTitle ?? "MoH Uganda: National Health Portal - Main"}
          </span>
          <div className={styles.titleBarMeta}>
            <div className={styles.userMenu} ref={userMenuRef}>
              <button
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className={styles.userMenuButton}
                disabled={logoutMutation.isPending || isRoutingOut}
                onClick={() => setUserMenuOpen((v) => !v)}
                type="button"
              >
                <span className={styles.userMenuIcon} aria-hidden="true">
                  <svg fill="none" height="14" viewBox="0 0 20 20" width="14">
                    <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                    <path
                      d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
                <span className={styles.userMenuName}>{username}</span>
                <span className={styles.userMenuChevron} aria-hidden="true">
                  <svg fill="currentColor" height="10" viewBox="0 0 10 10" width="10">
                    <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </button>

              {userMenuOpen && (
                <div className={styles.userMenuDropdown} role="menu">
                  <button
                    className={styles.userMenuDropdownItem}
                    onClick={handleOpenSettings}
                    type="button"
                  >
                    <span className={styles.userMenuDropdownIcon} aria-hidden="true">
                      <svg fill="none" height="13" viewBox="0 0 20 20" width="13">
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                        <path
                          d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.36 4.64l-1.06 1.06M5.7 14.3l-1.06 1.06M15.36 15.36l-1.06-1.06M5.7 5.7 4.64 4.64"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.4"
                        />
                      </svg>
                    </span>
                    Settings
                  </button>
                  <div className={styles.userMenuDivider} />
                  <button
                    className={styles.userMenuDropdownItem}
                    disabled={logoutMutation.isPending || isRoutingOut}
                    onClick={handleLogout}
                    type="button"
                  >
                    <span className={styles.userMenuDropdownIcon} aria-hidden="true">
                      <svg fill="none" height="13" viewBox="0 0 20 20" width="13">
                        <path
                          d="M8 4.5H4.8A1.8 1.8 0 0 0 3 6.3v7.4a1.8 1.8 0 0 0 1.8 1.8H8"
                          stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4"
                        />
                        <path d="M11 6.2 15 10l-4 3.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                        <path d="M7 10h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                      </svg>
                    </span>
                    {logoutMutation.isPending || isRoutingOut ? "Signing out..." : "Log out"}
                  </button>
                </div>
              )}
            </div>
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
