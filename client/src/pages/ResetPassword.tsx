import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";

import { PublicHeader } from "@/components/layout/PublicHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useResetPassword } from "@/hooks/useAuth";
import { validatePasswordComplexity } from "@/utils/password.validator";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(50, "Password must be less than 50 characters")
      .refine((password) => {
        const validation = validatePasswordComplexity(password);
        return validation.isValid;
      }, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate: resetPassword } = useResetPassword();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) return;

    setIsLoading(true);
    resetPassword(
      { token, newPassword: values.newPassword },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          setIsSuccess(true);
          setIsLoading(false);
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to reset password. Please try again.",
          );
          setIsLoading(false);
        },
      }
    );
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PublicHeader />

        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Password Reset Successful</h1>
              <p className="text-sm text-muted-foreground">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>

            <Card className="shadow-lg rounded-xl">
              <CardContent className="pt-6">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Will redirect automatically
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PublicHeader />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your new password below.
            </p>
          </div>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Choose a strong password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => {
                      const passwordValidation = validatePasswordComplexity(field.value);
                      return (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Create a strong password"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-muted-foreground">Password requirements:</p>
                              <div className="space-y-1">
                                <div className={`flex items-center text-xs ${passwordValidation.requirements.minLength ? 'text-green-600' : 'text-red-600'}`}>
                                  <span className="mr-1">{passwordValidation.requirements.minLength ? '×' : '·'}</span>
                                  At least 8 characters
                                </div>
                                <div className={`flex items-center text-xs ${passwordValidation.requirements.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                                  <span className="mr-1">{passwordValidation.requirements.hasUppercase ? '×' : '·'}</span>
                                  One uppercase letter
                                </div>
                                <div className={`flex items-center text-xs ${passwordValidation.requirements.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                                  <span className="mr-1">{passwordValidation.requirements.hasLowercase ? '×' : '·'}</span>
                                  One lowercase letter
                                </div>
                                <div className={`flex items-center text-xs ${passwordValidation.requirements.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                                  <span className="mr-1">{passwordValidation.requirements.hasNumber ? '×' : '·'}</span>
                                  One number
                                </div>
                              </div>
                            </div>
                          )}
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="justify-center text-sm border-t pt-6 text-muted-foreground">
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Back to Sign In
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
