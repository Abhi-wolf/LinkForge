import { api } from './mockApi';
import type { AnalyticsData, AnalyticsFilter } from './mockApi';

export const analyticsService = {
    getAnalytics: async (linkId: string, filter: AnalyticsFilter = 'Day'): Promise<AnalyticsData> => {
        // We pass filter just to simulate filtering
        const response = await api.get(`/analytics/${linkId}?filter=${filter}`);
        return response.data;
    }
};
