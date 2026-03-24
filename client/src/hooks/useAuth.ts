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

export function useForgotPassword() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.requestPasswordReset.mutationOptions());
}

export function useResetPassword() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.resetPassword.mutationOptions());
}

export function useSendEmailVerification() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.sendEmailVerification.mutationOptions());
}

export function useVerifyEmail() {
  const trpc = useTRPC();

  return useMutation(trpc.auth.verifyEmail.mutationOptions());
}
