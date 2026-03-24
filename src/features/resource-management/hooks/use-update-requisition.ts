"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourceManagementQueryKeys } from "@/src/features/resource-management/hooks/resource-management-query-keys";
import { updateRequisition } from "@/src/features/resource-management/lib/resource-management-client";
import type { CreateRequisitionPayload } from "@/src/features/resource-management/types/resource-management";

export function useUpdateRequisition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: CreateRequisitionPayload }) =>
            updateRequisition(id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: resourceManagementQueryKeys.requisitions()
            });
        }
    });
}
