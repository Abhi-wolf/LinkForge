import { useQuery } from '@tanstack/react-query';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    environment: string;
    uptimeHours: number;
    timestamp: string;
    services?: {
        database: { status: 'up' | 'down'; responseTimeMs: number };
        redis: { status: 'up' | 'down'; responseTimeMs: number };
        analyticsQueue: { status: 'up' | 'down'; responseTimeMs: number };
        deadLetterQueue: { status: 'up' | 'down'; responseTimeMs: number };
    };
    memory?: {
        usagePercent: number;
        status: 'up' | 'down';
    };
}

interface ServiceHealth {
    isHealthy: boolean;
    isDegraded: boolean;
    isLoading: boolean;
    lastChecked: Date | null;
    status?: HealthStatus;
}

const fetchHealthStatus = async (): Promise<HealthStatus> => {
    const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'http://localhost:4000'}/ready`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch health status');
    }
    
    return response.json();
};

export const useHealth = () => {
    const { data, isLoading, error, refetch } = useQuery<HealthStatus>({
        queryKey: ['health'],
        queryFn: fetchHealthStatus,
        refetchInterval: 60000, // Check every 60 seconds
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 60000, // Consider data stale after 60 seconds
    });

    const serviceHealth: ServiceHealth = {
        isHealthy: data?.status === 'healthy',
        isDegraded: data?.status === 'degraded',
        isLoading,
        lastChecked: data ? new Date(data.timestamp) : null,
        status: data,
    };

    return {
        ...serviceHealth,
        error,
        refetch,
    };
};
