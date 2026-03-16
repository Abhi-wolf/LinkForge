import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/services/trpc";
import { analyticsService } from "@/services/analyticsService";
import type { AnalyticsFilter } from "@/services/mockApi";

/**
 * Fetch analytics data for a specific link.
 * @param linkId - The ID of the short link.
 * @param filter - Time range filter: 'Day' | 'Month' | 'Year'.
 */
export function useAnalytics(
  linkId: string | undefined,
  filter: AnalyticsFilter = "Day",
) {
  return useQuery({
    queryKey: ["analytics", linkId, filter],
    queryFn: () => analyticsService.getAnalytics(linkId!, filter),
    enabled: !!linkId,
  });
}

/**
 * Fetch overview analytics (uses the first available link as a proxy for global data).
 * Intended for use in the Dashboard Overview page.
 * @param firstLinkId - ID of the first link, used as a stand-in for aggregate data.
 */
export function useOverviewAnalytics(firstLinkId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "overview", firstLinkId],
    queryFn: () => analyticsService.getAnalytics(firstLinkId!, "Month"),
    enabled: !!firstLinkId,
  });
}

export function useDashboardAnalytics() {
  const trpc = useTRPC();

  return useQuery(trpc.analytics.getDashboardAnalytics.queryOptions());
}
