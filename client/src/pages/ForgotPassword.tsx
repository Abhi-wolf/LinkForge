import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
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
import { useForgotPassword } from "@/hooks/useAuth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { mutate: requestPasswordReset } = useForgotPassword();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    requestPasswordReset(values, {
      onSuccess: (data) => {
        toast.success(data.message);
        setIsSuccess(true);
        setIsLoading(false);
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to send reset email. Please try again.",
        );
        setIsLoading(false);
      },
    });
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to your email address.
              </p>
              <p className="text-xs text-muted-foreground">
                The link will expire in 30 minutes. If you don't receive an email, check your spam folder.
              </p>
            </div>

            <Card className="shadow-lg rounded-xl">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
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

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PublicHeader />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                Enter your email to receive a password reset link.
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="justify-center text-sm border-t pt-6 text-muted-foreground">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline ml-1 font-medium"
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
