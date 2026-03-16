import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { linkService } from "@/services/linkService";
import { useTRPC } from "@/services/trpc";

/** Fetch all links for the authenticated user. */
export function useLinks() {
  const trpc = useTRPC();

  return useQuery(trpc.url.getAllUrls.queryOptions());
}

/** Mutation: create a new short link. Invalidates ['links'] on success. */
export function useCreateLink() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.url.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.url.getAllUrls.queryKey(),
        });
      },
      onError: (error) => {
        console.error(error);
      },
    }),
  );
}

/** Mutation: delete a link by id. Invalidates ['links'] on success. */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => linkService.deleteLink(id),
    onSuccess: () => {
      toast.success("Link deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: () => {
      toast.error("Failed to delete link");
    },
  });
}
