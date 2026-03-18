import { useTRPC } from "@/services/trpc";
import { useMutation } from "@tanstack/react-query";

export function useRegister() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.register.mutationOptions());
}

export function useLogin() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.login.mutationOptions());
}
