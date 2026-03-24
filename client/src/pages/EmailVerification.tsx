import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { PublicHeader } from "@/components/layout/PublicHeader";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useVerifyEmail } from "@/hooks/useAuth";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate: verifyEmail } = useVerifyEmail();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const token = searchParams.get("token");

  const handleVerification = useCallback(() => {
    if (!token) return;

    setIsLoading(true);
    verifyEmail({ token }, {
      onSuccess: (data) => {
        toast.success(data.message);
        setIsSuccess(true);
        setIsLoading(false);
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to verify email. The link may have expired.",
        );
        setIsError(true);
        setIsLoading(false);
      },
    });
  }, [token, verifyEmail]);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid verification link");
      setIsError(true);
    } else {
      // Auto-submit the verification when component mounts
      handleVerification();
    }
  }, [token, handleVerification]);

  if (isError) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PublicHeader />

        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Verification Failed</h1>
              <p className="text-sm text-muted-foreground">
                This email verification link is invalid or has expired.
              </p>
            </div>

            <Card className="shadow-lg rounded-xl">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Need a new verification email?
                  </p>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="w-full mb-2"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold tracking-tight">Email Verified Successfully</h1>
              <p className="text-sm text-muted-foreground">
                Your email has been verified. You can now sign in to your account.
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

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PublicHeader />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Verifying your email</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Please wait while we verify your email..." : "Processing..."}
            </p>
          </div>

          <Card className="shadow-lg rounded-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  This should only take a moment...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
