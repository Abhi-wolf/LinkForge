import axios from 'axios';

// Create a custom axios instance
export const api = axios.create({
    baseURL: 'https://api.linkforge.example.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Mock Data Models
export type ShortLink = {
    id: string;
    originalUrl: string;
    shortUrl: string;
    alias?: string;
    createdAt: string | Date;
    expirationDate?: string | Date | null;
    clicks: number;
    status: string;
    tags?: string[];
    fullUrl: string;
};

export type AnalyticsFilter = 'Day' | 'Month' | 'Year';

export type AnalyticsData = {
    totalClicks: number;
    chartData: { date: string; clicks: number }[];
    deviceData: { name: string; value: number }[];
    browserData: { name: string; value: number }[];
    countryData: { country: string; clicks: number; percentage: number }[];
    regionData: { name: string; value: number }[];
    utmSourceData: { name: string; value: number }[];
    referrerData: { name: string; value: number }[];
};

// Initial Mock Data
let mockLinks: ShortLink[] = [
    {
        id: '1',
        originalUrl: 'https://www.google.com/search?q=react+query+tutorial+2024',
        shortUrl: 'https://linkf.org/qx9T8s',
        alias: 'qx9T8s',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        clicks: 245,
        status: 'Active',
    },
    {
        id: '2',
        originalUrl: 'https://shadcn.com/docs/components/table',
        shortUrl: 'https://linkf.org/shadTable',
        alias: 'shadTable',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        clicks: 102,
        status: 'Active',
    },
    {
        id: '3',
        originalUrl: 'https://example.com/very/long/url/that/nobody/wants/to/copy',
        shortUrl: 'https://linkf.org/promo24',
        alias: 'promo24',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        expirationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        clicks: 890,
        status: 'Expired',
    },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Intercept requests and return mocked responses
api.interceptors.request.use(async (config) => {
    await delay(800); // Simulate 800ms network delay

    if (config.url === '/links' && config.method === 'get') {
        // Return mocked links
        return Promise.reject({
            isMockInterceptor: true,
            data: [...mockLinks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        });
    }

    if (config.url === '/links' && config.method === 'post') {
        const { originalUrl, alias } = JSON.parse(config.data);

        // Check for alias conflict
        if (alias && mockLinks.some(link => link.alias === alias)) {
            return Promise.reject({
                isMockInterceptor: true,
                status: 400,
                data: { message: 'Alias already in use' }
            });
        }

        const newAlias = alias || Math.random().toString(36).substring(2, 8);
        const newLink: ShortLink = {
            id: Math.random().toString(36).substring(2, 11),
            originalUrl,
            shortUrl: `https://linkf.org/${newAlias}`,
            alias: newAlias,
            createdAt: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            clicks: 0,
            status: 'Active',
        };

        mockLinks.push(newLink);

        return Promise.reject({
            isMockInterceptor: true,
            data: newLink
        });
    }

    if (config.url?.startsWith('/links/') && config.method === 'delete') {
        const id = config.url.split('/').pop();
        mockLinks = mockLinks.filter(l => l.id !== id);
        return Promise.reject({
            isMockInterceptor: true,
            data: { success: true }
        });
    }

    if (config.url?.startsWith('/analytics/') && config.method === 'get') {
        // Mock analytics logic
        const mockAnalytics: AnalyticsData = {
            totalClicks: Math.floor(Math.random() * 5000),
            chartData: [
                { date: 'Mon', clicks: Math.floor(Math.random() * 100) },
                { date: 'Tue', clicks: Math.floor(Math.random() * 100) },
                { date: 'Wed', clicks: Math.floor(Math.random() * 100) },
                { date: 'Thu', clicks: Math.floor(Math.random() * 100) },
                { date: 'Fri', clicks: Math.floor(Math.random() * 100) },
                { date: 'Sat', clicks: Math.floor(Math.random() * 100) },
                { date: 'Sun', clicks: Math.floor(Math.random() * 100) },
            ],
            deviceData: [
                { name: 'Mobile', value: 65 },
                { name: 'Desktop', value: 30 },
                { name: 'Tablet', value: 5 },
            ],
            browserData: [
                { name: 'Chrome', value: 55 },
                { name: 'Safari', value: 25 },
                { name: 'Firefox', value: 10 },
                { name: 'Edge', value: 10 },
            ],
            countryData: [
                { country: 'United States', clicks: 1205, percentage: 40 },
                { country: 'United Kingdom', clicks: 602, percentage: 20 },
                { country: 'India', clicks: 450, percentage: 15 },
                { country: 'Germany', clicks: 300, percentage: 10 },
                { country: 'Others', clicks: 450, percentage: 15 },
            ],
            regionData: [
                { name: 'North America', value: 45 },
                { name: 'Europe', value: 35 },
                { name: 'Asia', value: 15 },
                { name: 'Others', value: 5 },
            ],
            utmSourceData: [
                { name: 'Twitter', value: 35 },
                { name: 'Google', value: 30 },
                { name: 'Direct', value: 20 },
                { name: 'LinkedIn', value: 10 },
                { name: 'Newsletter', value: 5 },
            ],
            referrerData: [
                { name: 't.co', value: 35 },
                { name: 'google.com', value: 30 },
                { name: 'direct', value: 20 },
                { name: 'linkedin.com', value: 10 },
                { name: 'github.com', value: 5 },
            ]
        };

        return Promise.reject({
            isMockInterceptor: true,
            data: mockAnalytics
        });
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to transform our rejected promises back into successful responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.isMockInterceptor) {
            if (error.status >= 400) {
                return Promise.reject(error);
            }
            return Promise.resolve({ data: error.data, status: 200, statusText: 'OK' });
        }
        return Promise.reject(error);
    }
);
