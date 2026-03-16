import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Calendar, Copy, Trash2, QrCode as QrCodeIcon, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import type { AnalyticsFilter } from '@/services/mockApi';
import { linkService } from '@/services/linkService';
import { useLinks } from '@/hooks/useLinks';
import { useAnalytics } from '@/hooks/useAnalytics';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];

export default function Analytics() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<AnalyticsFilter>('Day');

    const { data: links, isLoading: linksLoading } = useLinks();
    const { data: analytics, isLoading: analyticsLoading } = useAnalytics(id, filter);

    const link = links?.find(l => l.id === id);
    const isLoading = linksLoading || analyticsLoading;

    if (isLoading || !analytics) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 border-b pb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[300px] w-full col-span-2 rounded-xl" />
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (!link) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold mb-2">Link not found</h2>
                <Button variant="link" onClick={() => navigate('/dashboard/links')}>Return to My Links</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Banner Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-muted/20 p-6 rounded-xl border">
                <div className="flex gap-4 items-start">
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full bg-background mt-1" onClick={() => navigate('/dashboard/links')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight break-all">
                            {link.shortUrl}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 truncate max-w-xl">
                            Original: <a href={link.originalUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{link.originalUrl}</a>
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(link.createdAt).toLocaleDateString()}
                            </Badge>
                            <Badge variant={link.status === 'Active' ? 'default' : 'secondary'} className={link.status === 'Active' ? 'bg-green-500' : ''}>
                                {link.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 select-none">
                    <Button variant="outline" className="gap-2" onClick={() => {
                        navigator.clipboard.writeText(link.shortUrl);
                        toast.success('Copied to clipboard!');
                    }}>
                        <Copy className="h-4 w-4" /> Copy
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <QrCodeIcon className="h-4 w-4" /> QR Code
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8">
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-center">QR Code</DialogTitle>
                                <DialogDescription>Scan to visit {link.alias}</DialogDescription>
                            </DialogHeader>
                            <div className="bg-white p-4 rounded-xl shadow-sm border">
                                <QRCodeSVG value={link.shortUrl} size={200} />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="destructive" className="gap-2" onClick={() => {
                        linkService.deleteLink(link.id);
                        toast.success('Link deleted');
                        navigate('/dashboard/links');
                    }}>
                        <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                </div>
            </div>

            {/* Metrics Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold">Analytics Overview</h2>
                    <p className="text-sm text-muted-foreground">Showing data filtered by selected time range</p>
                </div>
                <Select value={filter} onValueChange={(val: AnalyticsFilter) => setFilter(val)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Day">Past 24 Hours</SelectItem>
                        <SelectItem value="Month">Past 30 Days</SelectItem>
                        <SelectItem value="Year">Past Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Clicks Line Chart */}
                <Card className="col-span-full lg:col-span-2 shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle>Total Clicks Over Time</CardTitle>
                        <CardDescription className="text-4xl font-black text-primary mt-2">
                            {analytics.totalClicks.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">clicks</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs" stroke="#888888" />
                                <YAxis className="text-xs" stroke="#888888" tickFormatter={(v) => `${v}`} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Device Type Pie Chart */}
                <Card className="shadow-sm rounded-xl flex flex-col">
                    <CardHeader>
                        <CardTitle>Devices</CardTitle>
                        <CardDescription>Clicks by device type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.deviceData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Browser Bar Chart */}
                <Card className="shadow-sm rounded-xl lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Browsers</CardTitle>
                        <CardDescription>Clicks by browser</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.browserData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                <XAxis type="number" className="text-xs" stroke="#888888" />
                                <YAxis dataKey="name" type="category" className="text-xs" stroke="#888888" width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30}>
                                    {analytics.browserData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Region Pie Chart */}
                <Card className="shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle>Regions</CardTitle>
                        <CardDescription>Clicks by continent</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.regionData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {analytics.regionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Countries Table */}
                <Card className="col-span-full shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle>Top Countries</CardTitle>
                        <CardDescription>Where your audience is located</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.countryData.map((country, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm w-4 text-muted-foreground">{idx + 1}.</span>
                                        <span className="font-medium text-sm">{country.country}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm w-[150px] justify-end">
                                        <span>{country.clicks.toLocaleString()} clicks</span>
                                        <span className="text-muted-foreground w-12 text-right">{country.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
