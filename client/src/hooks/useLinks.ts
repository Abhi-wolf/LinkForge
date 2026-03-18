import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/services/trpc";

/** Fetch all links for the authenticated user. */
export function useLinks() {
  const trpc = useTRPC();

  return useQuery(trpc.url.getAllUrlsOfUser.queryOptions());
}

/** Mutation: create a new short link. Invalidates ['links'] on success. */
export function useCreateLink() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.url.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.url.getAllUrlsOfUser.queryKey(),
        });
      },
      onError: (error) => {
        console.error(error);
      },
    }),
  );
}

/** Mutation: update the original URL of a link. */
export function useUpdateLink() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.url.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.url.getAllUrlsOfUser.queryKey(),
        });
      },
      onError: (error) => {
        console.error(error);
      },
    }),
  );
}

/** Mutation: update status of a link (e.g., active, blocked). */
export function useUpdateLinkStatus() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.url.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.url.getAllUrlsOfUser.queryKey(),
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
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.url.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.url.getAllUrlsOfUser.queryKey(),
        });
      },
      onError: (error) => {
        console.error(error);
      },
    }),
  );
}
