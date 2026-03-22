import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/services/trpc";

export function useApiKeys() {
  const trpc = useTRPC();

  return useQuery(trpc.apiKey.getApiKeys.queryOptions());
}

export function useCreateApiKey() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(trpc.apiKey.createApiKey.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
          queryKey: trpc.apiKey.getApiKeys.queryKey(),
        });
    },
  }));
}

export function useVerifyApiKey(apiKey: string) {
  const trpc = useTRPC();

  return useQuery(trpc.apiKey.verifyApiKey.queryOptions({ apiKey }));
}

export function useUpdateApiKeyStatus() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(trpc.apiKey.updateStatus.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
          queryKey: trpc.apiKey.getApiKeys.queryKey(),
        });
    },
  }));
}

export function useDeleteApiKey() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(trpc.apiKey.deleteApiKey.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
          queryKey: trpc.apiKey.getApiKeys.queryKey(),
        });
    },
  }));
}
