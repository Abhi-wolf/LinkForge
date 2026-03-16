import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Link as LinkIcon, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PublicHeader } from '@/components/layout/PublicHeader';

import { linkService } from '@/services/linkService';
import type { ShortLink } from '@/services/mockApi';

const formSchema = z.object({
    url: z.string().url("Please enter a valid URL (e.g., https://example.com)"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LandingPage() {
    const [generatedLink, setGeneratedLink] = useState<ShortLink | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: '',
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormValues) => linkService.createShortLink(data.url),
        onSuccess: (data) => {
            setGeneratedLink(data);
            form.reset();
            toast.success("Short link generated successfully!");
        },
        onError: (error: any) => {
            const message = error?.data?.message || 'Failed to generate link';
            toast.error(message);
        }
    });

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink.shortUrl);
            toast.success("Copied to clipboard!");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse delay-700" />
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-500/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse delay-1000" />

            <PublicHeader showAuthButtons />

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-12">
                <div className="text-center space-y-6 max-w-4xl mx-auto mt-10 md:mt-0">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-2">
                        <Zap className="h-4 w-4" /> The future of link management
                    </Badge>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter">
                        Shorten. Share. <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-primary to-blue-500">
                            Track everything.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed mb-8">
                        The ultimate modern URL shortener. Create clean links, track conversions, and manage your brand effortlessly.
                    </p>
                </div>

                <div className="w-full max-w-3xl transform transition-all hover:scale-[1.01] duration-500">
                    <Card className="shadow-2xl shadow-primary/10 rounded-[2rem] border-muted/50 bg-background/60 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-2 sm:p-4">
                            {!generatedLink ? (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex flex-col sm:flex-row items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name="url"
                                            render={({ field }) => (
                                                <FormItem className="w-full flex-1 space-y-0">
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                                                <LinkIcon className="h-6 w-6 text-muted-foreground group-focus-within:text-primary" />
                                                            </div>
                                                            <Input
                                                                className="h-20 pl-16 pr-6 text-xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/60"
                                                                placeholder="Paste your long link here..."
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="h-16 w-full sm:w-auto px-10 rounded-[1.2rem] text-lg font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                                            disabled={mutation.isPending}
                                        >
                                            {mutation.isPending ? "Generating..." : (
                                                <>Shorten Now <ArrowRight className="ml-2 h-6 w-6" /></>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            ) : (
                                <div className="space-y-6 p-6">
                                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                        <div className="bg-white p-4 rounded-3xl shadow-sm border transform hover:scale-105 transition-transform duration-300">
                                            <QRCodeSVG value={generatedLink.shortUrl} size={160} />
                                        </div>
                                        <div className="flex flex-col gap-4 w-full flex-1">
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your short link is ready</p>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        readOnly
                                                        value={generatedLink.shortUrl}
                                                        className="h-14 font-mono text-lg bg-muted/50 border-input shadow-inner focus-visible:ring-0"
                                                    />
                                                    <Button size="icon" className="h-14 w-14 rounded-xl shrink-0 transition-transform active:scale-95" onClick={copyToClipboard}>
                                                        <Copy className="h-6 w-6" />
                                                        <span className="sr-only">Copy</span>
                                                    </Button>
                                                </div>
                                            </div>
                                            <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-xl">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Guest Link Warning</AlertTitle>
                                                <AlertDescription>
                                                    Expires in 7 days. Create an account to track stats.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>

                                    <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setGeneratedLink(null)}>
                                        Create Another Link
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Error message slot */}
                    {form.formState.errors.url && !generatedLink && (
                        <p className="text-sm font-medium text-destructive mt-4 text-center animate-in slide-in-from-top-2">
                            {form.formState.errors.url.message}
                        </p>
                    )}
                </div>

                {/* Stats / Trust section preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-24 pt-16 border-t border-muted/30 mt-16 text-center opacity-80">
                    <div className="space-y-2">
                        <h4 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">10M+</h4>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Links Created</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">50M+</h4>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Clicks Tracked</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">99.9%</h4>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Uptime</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">50k+</h4>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Users</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
