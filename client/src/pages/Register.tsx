import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
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

import { useRegister } from "@/hooks/useAuth";
import { validatePasswordComplexity } from "@/utils/password.validator";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(50, "Password must be less than 50 characters")
    .refine((password) => {
      const validation = validatePasswordComplexity(password);
      return validation.isValid;
    }, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { mutate: registerUser } = useRegister();
  const [isLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    registerUser(values, {
      onSuccess: (data) => {
        if (data.user.email) {
          toast.success(
            "Account created successfully! Please verify your email by clicking the link in the email.",
          );
          navigate("/login");
        }
      },
      onError: (err) => {
        toast.error(err.message || "Registration failed");
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PublicHeader />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Start shrinking links with LinkForge
            </p>
          </div>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your details to register.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            type="text"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    render={({ field }) => {
                      const passwordValidation = validatePasswordComplexity(field.value);
                      return (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="justify-center text-sm border-t pt-6 text-muted-foreground">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-primary hover:underline ml-1 font-medium"
              >
                Log in
              </a>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
