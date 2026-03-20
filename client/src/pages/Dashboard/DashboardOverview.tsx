import React, { useState } from "react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Link2,
  MousePointerClick,
  TrendingUp,
  Copy,
  ExternalLink,
  PieChart as PieChartIcon,
  RefreshCcw,
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
import { Spinner } from "@/components/ui/spinner";

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "recent" | "top" | "inactive" | "expired"
  >("recent");

  const {
    data: dashboardAnalytics,
    isLoading: dashboardLoading,
    refetch: refetchDashboardAnalytics,
  } = useDashboardAnalytics();

  if (dashboardLoading) {
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
  const inactiveLinksCount = dashboardAnalytics?.inactiveLinks?.length || 0;
  const expiredLinksCount = dashboardAnalytics?.expiredLinks?.length || 0;
  const totalClicksAcrossLinks = dashboardAnalytics?.totalClicks || 0;
  const avgClicksPerLink =
    totalLinks > 0 ? Math.round(totalClicksAcrossLinks / totalLinks) : 0;

  const statusData = [
    { name: "Active", value: activeLinks, color: "hsl(var(--success, 142 71% 45%))" },
    {
      name: "Inactive",
      value: inactiveLinksCount,
      color: "hsl(var(--warning, 45 93% 47%))",
    },
    {
      name: "Expired",
      value: expiredLinksCount,
      color: "hsl(var(--destructive))",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getLinksForTab = () => {
    switch (activeTab) {
      case "recent":
        return dashboardAnalytics?.recentLinks || [];
      case "top":
        return dashboardAnalytics?.topPerformingLinks || [];
      case "inactive":
        return dashboardAnalytics?.inactiveLinks || [];
      case "expired":
        return dashboardAnalytics?.expiredLinks || [];
      default:
        return [];
    }
  };

  const currentLinks = getLinksForTab();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="flex items-center gap-2">
          <CreateLinkDialog />

          <Button
            variant="secondary"
            disabled={dashboardLoading}
            onClick={() => refetchDashboardAnalytics()}
          >
            {dashboardLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </Button>

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
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {activeLinks} Active
              </Badge>
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {inactiveLinksCount} Inactive
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 text-destructive border-destructive/30"
              >
                {expiredLinksCount} Expired
              </Badge>
            </div>
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
        {/* Links Overview with Tabs */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-xl">Links Overview</CardTitle>
                <CardDescription>
                  Manage and monitor your URL categories
                </CardDescription>
              </div>
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <button
                  onClick={() => setActiveTab("recent")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === "recent"
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setActiveTab("top")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === "top"
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => setActiveTab("inactive")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === "inactive"
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                >
                  Inactive
                </button>
                <button
                  onClick={() => setActiveTab("expired")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === "expired"
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:bg-background/50"
                  }`}
                >
                  Expired
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentLinks.length ? (
                currentLinks.slice(0, 5).map((link: any) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 overflow-hidden mr-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none truncate">
                          {link.fullUrl}
                        </p>
                        {activeTab === "top" && (
                          <Badge
                            variant="secondary"
                            className="px-1 py-0 h-4 text-[10px]"
                          >
                            {link.clicks} clicks
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[9px] h-3 px-1 border-none ${
                            link.status.toLowerCase() === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : link.status.toLowerCase() === "inactive"
                                ? "bg-orange-500/10 text-orange-600"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {link.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                        {link.originalUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(link.fullUrl)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        asChild
                      >
                        <a
                          href={link.fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">No {activeTab} links found</p>
                </div>
              )}
            </div>
            {currentLinks.length > 5 && (
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/dashboard/links")}
                >
                  View all in My Links
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <CardTitle>Link Status</CardTitle>
            </div>
            <CardDescription>Health of your URL ecosystem</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[250px]">
            {totalLinks > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-4 w-full px-2">
                  {statusData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-full border-4 border-dashed border-muted flex items-center justify-center">
                  <Link2 className="h-8 w-8 opacity-20" />
                </div>
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Insight Card (Replacing the simple Top Table with a more informative one) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle>Performance Insights</CardTitle>
          </div>
          <CardDescription>
            Deep dive into your most engaging content
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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardAnalytics.topPerformingLinks.map((link: any) => (
                  <TableRow
                    key={link.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/dashboard/analytics/${link.id}`)}
                  >
                    <TableCell className="font-medium font-mono text-xs">
                      {link.fullUrl}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground italic text-xs">
                      <div className="truncate max-w-[250px]">
                        {link.originalUrl}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 px-1 ${
                          link.status.toLowerCase() === "active"
                            ? "text-emerald-500 border-emerald-500/30"
                            : link.status.toLowerCase() === "inactive"
                              ? "text-orange-500 border-orange-500/30"
                              : "text-destructive border-destructive/30"
                        }`}
                      >
                        {link.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold">
                          {link.clicks.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          Clicks
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
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
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <PieChartIcon className="h-10 w-10 mb-2 opacity-20" />
              <p>No performance data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
