"use client";

import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/src/features/settings/hooks/settings-query-keys";
import {
  fetchMigrationStatus,
  fetchPermissionStats,
  fetchRbacStats,
  fetchRoleStats
} from "@/src/features/settings/lib/settings-client";

export function useRbacStats() {
  return useQuery({
    queryKey: settingsQueryKeys.rbacStats(),
    queryFn: fetchRbacStats,
    staleTime: 60 * 1000
  });
}

export function useRoleStats() {
  return useQuery({
    queryKey: settingsQueryKeys.roleStats(),
    queryFn: fetchRoleStats,
    staleTime: 60 * 1000
  });
}

export function usePermissionStats() {
  return useQuery({
    queryKey: settingsQueryKeys.permissionStats(),
    queryFn: fetchPermissionStats,
    staleTime: 60 * 1000
  });
}

export function useMigrationStatus() {
  return useQuery({
    queryKey: settingsQueryKeys.migrationStatus(),
    queryFn: fetchMigrationStatus,
    staleTime: 60 * 1000
  });
}
