import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/services/trpc";





export function useDashboardAnalytics() {
  const trpc = useTRPC();

  return useQuery(trpc.analytics.getDashboardAnalytics.queryOptions());
}

export function useAnalyticsForUrlId(
  urlId: string,
  startDate: Date,
  endDate: Date,
) {
  const trpc = useTRPC();

  return useQuery(
    trpc.analytics.getAnalytics.queryOptions({ urlId, startDate, endDate }),
  );
}
