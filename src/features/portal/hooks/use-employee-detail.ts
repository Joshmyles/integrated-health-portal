"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEmployeeDetail } from "@/src/features/portal/lib/employee-client";

export function useEmployeeDetail(employeeId: number | null) {
  return useQuery({
    queryKey: ["portal", "employee-detail", employeeId],
    queryFn: () => fetchEmployeeDetail(employeeId as number),
    enabled: employeeId !== null
  });
}
