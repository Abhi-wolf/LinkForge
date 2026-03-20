import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Calendar, Copy, Trash2, QrCode as QrCodeIcon, ArrowLeft, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { linkService } from '@/services/linkService';
import { useAnalyticsForUrlId, useDashboardAnalytics } from '@/hooks/useAnalytics';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];

export default function Analytics() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Internal state for the date picker inputs
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
    });

    // State for the dates actually used in the fetch
    const [appliedDateRange, setAppliedDateRange] = useState(dateRange);


    const { data: analyticsResponse, isLoading: analyticsLoading } = useAnalyticsForUrlId(
        id!,
        appliedDateRange.from,
        appliedDateRange.to
    );

    const handleFetch = () => {
        setAppliedDateRange(dateRange);
    };

    // Use urlDesc from backend response
    const link = analyticsResponse?.urlDesc;

    const isLoading = analyticsLoading;
    const isLinkNotFound = !analyticsLoading && !link;

    // Map backend data to UI format
    const analytics = analyticsResponse?.analyticsNumbers ? {
        totalClicks: analyticsResponse.analyticsNumbers.clicks,
        chartData: analyticsResponse.analyticsNumbers.clicksPerDay,
        deviceData: analyticsResponse.analyticsNumbers.device.map(d => ({ name: d.key, value: d.value })),
        browserData: analyticsResponse.analyticsNumbers.browser.map(b => ({ name: b.key, value: b.value })),
        countryData: analyticsResponse.analyticsNumbers.country.map(c => ({
            country: c.key,
            clicks: c.value,
            percentage: analyticsResponse.analyticsNumbers.clicks > 0
                ? Math.round((c.value / analyticsResponse.analyticsNumbers.clicks) * 100)
                : 0
        })),
        regionData: analyticsResponse.analyticsNumbers.region.map(r => ({ name: r.key, value: r.value })),
        utmSourceData: analyticsResponse.analyticsNumbers.utmSource.map(u => ({ name: u.key, value: u.value })),
        referrerData: analyticsResponse.analyticsNumbers.ref.map(r => ({ name: r.key, value: r.value }))
    } : null;

    if (!analytics) {
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

    if (isLinkNotFound) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="p-6 rounded-full bg-muted/50">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Link not found</h2>
                    <p className="text-muted-foreground">The link you're looking for might have been deleted or is not available.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/dashboard/links')}>Return to My Links</Button>
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
                            {link?.fullUrl}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 truncate max-w-xl">
                            Original: <a href={link?.originalUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{link?.originalUrl}</a>
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(link.createdAt).toLocaleDateString()}
                            </Badge>
                            <Badge variant={link?.status === 'active' ? 'default' : 'secondary'} className={link.status === 'active' ? 'bg-green-500' : ''}>
                                {link?.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 select-none">
                    <Button variant="outline" className="gap-2" onClick={() => {
                        navigator.clipboard.writeText(link?.fullUrl);
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
                                <DialogDescription>Scan to visit {link.fullUrl}</DialogDescription>
                            </DialogHeader>
                            <div className="bg-white p-4 rounded-xl shadow-sm border">
                                <QRCodeSVG value={link.fullUrl} size={200} />
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
                    <p className="text-sm text-muted-foreground">Showing data filtered by selected date range</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 text-sm shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">From</span>
                            <input
                                type="date"
                                className="bg-transparent border-none focus:ring-0 text-sm h-7"
                                value={dateRange.from.toISOString().split('T')[0]}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                            />
                        </div>
                        <div className="w-px h-8 bg-border mx-1" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">To</span>
                            <input
                                type="date"
                                className="bg-transparent border-none focus:ring-0 text-sm h-7"
                                value={dateRange.to.toISOString().split('T')[0]}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                            />
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleFetch}
                        className="h-10 px-4 rounded-lg shadow-sm"
                        disabled={analyticsLoading}
                    >
                        {analyticsLoading ? 'Fetching...' : 'Fetch Data'}
                    </Button>
                </div>
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
                            <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                                <XAxis
                                    dataKey="date"
                                    className="text-xs"
                                    stroke="hsl(var(--muted-foreground))"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                                    }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    className="text-xs"
                                    stroke="hsl(var(--muted-foreground))"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'hsl(var(--background))'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorClicks)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
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
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
                                <XAxis type="number" className="text-xs" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" className="text-xs" stroke="hsl(var(--muted-foreground))" width={80} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
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

                {/* UTM Source Pie Chart */}
                <Card className="shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle>Sources (UTM)</CardTitle>
                        <CardDescription>Clicks by campaign source</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.utmSourceData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {analytics.utmSourceData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Referrer Bar Chart */}
                <Card className="shadow-sm rounded-xl lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Referrers</CardTitle>
                        <CardDescription>Top referring domains</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.referrerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/50" />
                                <XAxis type="number" className="text-xs" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" className="text-xs" stroke="hsl(var(--muted-foreground))" width={80} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30}>
                                    {analytics.referrerData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
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
