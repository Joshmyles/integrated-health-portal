"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { deleteRequisition } from "@/src/features/resource-management/lib/resource-management-client";

export function useDeleteRequisition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteRequisition(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: resourceManagementQueryKeys.requisitions()
            });
        }
    });
}
