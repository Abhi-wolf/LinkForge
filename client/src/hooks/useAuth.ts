import { useTRPC } from "@/services/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useRegister() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.register.mutationOptions());
}

export function useLogin() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.login.mutationOptions());
}

export function useLogout() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.logout.mutationOptions());
}

export function useGetMe() {
  const trpc = useTRPC();

  return useQuery(trpc.auth.me.queryOptions());
}

export function useUpdateUser() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.updateUser.mutationOptions());
}
