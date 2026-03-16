import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Link2,
  MousePointerClick,
  TrendingUp,
  History,
  Copy,
  ExternalLink,
  Award,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useDashboardAnalytics } from "@/hooks/useAnalytics";
import { CreateLinkDialog } from "@/components/CreateLinkDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverview() {
  const navigate = useNavigate();

  const analyticsResult = useDashboardAnalytics();
  const dashboardAnalytics = analyticsResult.data;
  const dashboardLoading = analyticsResult.isLoading;

  console.log("Dashboard Analytics Data: ", dashboardAnalytics);

  const isLoading = dashboardLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[400px] lg:col-span-4 rounded-xl" />
          <Skeleton className="h-[400px] lg:col-span-3 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalLinks = dashboardAnalytics?.totalLinks || 0;
  const activeLinks = dashboardAnalytics?.activeLinks || 0;
  const totalClicksAcrossLinks = dashboardAnalytics?.totalClicks || 0;
  const avgClicksPerLink =
    totalLinks > 0 ? Math.round(totalClicksAcrossLinks / totalLinks) : 0;

  const statusData = [
    { name: "Active", value: activeLinks, color: "hsl(var(--primary))" },
    {
      name: "Expired/Inactive",
      value: Math.max(0, totalLinks - activeLinks),
      color: "hsl(var(--muted))",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="flex items-center gap-2">
          <CreateLinkDialog />
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/links")}
          >
            View All Links
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLinks}</div>
            <p className="text-xs text-muted-foreground">
              {activeLinks} active currently
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClicksAcrossLinks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all shortened URLs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Engagement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClicksPerLink}</div>
            <p className="text-xs text-muted-foreground">
              Clicks per link on average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Links */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle>Recent Links</CardTitle>
            </div>
            <CardDescription>Your latest shortened URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardAnalytics?.recentLinks?.length ? (
                dashboardAnalytics.recentLinks.slice(0, 5).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {link.fullUrl}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                        {link.originalUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(link.fullUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={link.fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <p>No links created yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <CardTitle>Link Status</CardTitle>
            </div>
            <CardDescription>Active vs Inactive distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[250px]">
            {totalLinks > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {statusData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-1.5 text-xs font-medium"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Links Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <CardTitle>Top Performing Links</CardTitle>
          </div>
          <CardDescription>
            Your URLs with the highest engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardAnalytics?.topPerformingLinks?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short URL</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Destination
                  </TableHead>
                  <TableHead className="text-right">Click Count</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardAnalytics.topPerformingLinks.map((link: any) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.fullUrl}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      <div className="truncate max-w-[300px]">
                        {link.originalUrl}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {link.clicks.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(link.fullUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={link.fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <p>No analytics data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
