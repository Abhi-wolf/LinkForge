import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PublicHeader } from '@/components/layout/PublicHeader';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const setLogin = useAuthStore(state => state.login);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (values: LoginValues) => {
        setIsLoading(true);
        try {
            await authService.login(values.email, values.password);
            setLogin(values.email);
            toast.success("Successfully logged in!");
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            <PublicHeader />

            <div className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">Log in to your LinkForge account</p>
                    </div>

                    <Card className="shadow-lg rounded-xl">
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>Enter your email and password to continue.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="name@example.com" type="email" {...field} />
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
                                                    <Input placeholder="••••••••" type="password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Signing In...' : 'Sign In'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                        <CardFooter className="justify-center text-sm border-t pt-6 text-muted-foreground">
                            Don't have an account?{' '}
                            <a href="/register" className="text-primary hover:underline ml-1 font-medium">
                                Sign up
                            </a>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
