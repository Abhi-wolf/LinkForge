import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
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

import { useAuthStore } from "@/store/authStore";
import { useLogin, useSendEmailVerification } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { mutate: loginUser } = useLogin();
  const { mutate: sendVerification, isPending: isSendingVerification } =
    useSendEmailVerification();
  const setLogin = useAuthStore((state) => state.login);
  const [userEmail, setUserEmail] = useState("");
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    setUserEmail(values.email);
    loginUser(values, {
      onSuccess: (data) => {
        // console.log("Login data:", data);
        if (data.refreshToken) {
          setLogin({ refreshToken: data.refreshToken });
        }
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      },
      onError: (error) => {
        if (error.message.includes("EMAIL_NOT_VERIFIED")) {
          setShowVerificationWarning(true);
          setUserEmail(values.email);
        }

        try {
          const errors = JSON.parse(error.message);
          const firstMessage = errors[0]?.message ?? "Something went wrong";

          toast.error(firstMessage);
        } catch {
          // Fallback if message isn't a JSON array
          toast.error(error.message);
        }
        setIsLoading(false);
      },
    });
  };

  const handleResendVerification = async () => {
    if (!userEmail) return;

    try {
      await sendVerification({ email: userEmail });
      toast.success(
        `Verification email sent to ${userEmail}. Please check your inbox.`,
      );
    } catch (error) {
      console.error("handleResendVerification ERROR = ", error);
      toast.error("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PublicHeader />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Log in to your LinkForge account
            </p>
          </div>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your email and password to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showVerificationWarning && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.197V7c0-1.53-.962-2.502-3.197-2.502-3.197H6.082c-1.54 0-2.502 1.667-2.502 3.197v4.803c0 1.53.962 2.502 3.197 2.502z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium">
                        Email verification required
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please verify your email before logging in.
                      </p>
                      <Button
                        // variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        className="mt-2"
                        disabled={isSendingVerification}
                      >
                        {isSendingVerification
                          ? "Sending..."
                          : "Send Verification"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-2 text-sm border-t pt-6 text-muted-foreground">
              <div>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
              <Link
                to="/forgot-password"
                className="text-primary hover:underline font-medium text-xs"
              >
                Forgot your password?
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
