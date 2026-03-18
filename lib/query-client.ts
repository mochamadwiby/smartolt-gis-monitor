'use client';

import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

// Query client configuration
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Enable stale-while-revalidate strategy
      staleTime: 1000 * 30, // 30 seconds - data considered fresh
      gcTime: 1000 * 60 * 5, // 5 minutes - garbage collection time
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1,
    },
  },
};

// Create query client instance
export const createQueryClient = () => new QueryClient(queryClientConfig);

// Query keys for cache management
export const QueryKeys = {
  // OLT related queries
  olts: ['olts'] as const,
  oltDetails: (id: string) => ['olts', id] as const,
  oltPONPorts: (id: string) => ['olts', id, 'pon-ports'] as const,
  oltOutages: (id: string) => ['olts', id, 'outages'] as const,
  oltUptime: () => ['olts', 'uptime'] as const,

  // ONU related queries
  onus: () => ['onus'] as const,
  onusByOLT: (oltId?: string) => ['onus', { oltId }] as const,
  onuCoordinates: (filters?: any) => ['onus', 'coordinates', filters] as const,
  onuStatuses: (filters?: any) => ['onus', 'statuses', filters] as const,
  onuDetails: (id: string) => ['onus', id, 'details'] as const,
  onuSignal: (id: string) => ['onus', id, 'signal'] as const,

  // ODP related queries
  odps: () => ['odps'] as const,
  odpDetails: (id: string) => ['odps', id] as const,
  odpsByOLT: (oltId: string) => ['odps', { oltId }] as const,

  // Network topology
  topology: (filters?: any) => ['topology', filters] as const,
  connections: (filters?: any) => ['connections', filters] as const,

  // Dashboard metrics
  metrics: () => ['metrics'] as const,
  alerts: () => ['alerts'] as const,
  alertsByLevel: (level: string) => ['alerts', { level }] as const,

  // Health and status
  health: () => ['health'] as const,
};

// Query invalidation helpers
export const QueryInvalidation = {
  // Invalidate all OLT related queries
  olts: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['olts'] });
  },

  // Invalidate specific OLT data
  oltDetails: (queryClient: QueryClient, id: string) => {
    queryClient.invalidateQueries({ queryKey: ['olts', id] });
  },

  // Invalidate all ONU related queries
  onus: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['onus'] });
  },

  // Invalidate specific ONU data
  onuDetails: (queryClient: QueryClient, id: string) => {
    queryClient.invalidateQueries({ queryKey: ['onus', id] });
  },

  // Invalidate all dashboard metrics
  metrics: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
  },

  // Invalidate all alerts
  alerts: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  },

  // Invalidate all network topology data
  topology: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['topology'] });
    queryClient.invalidateQueries({ queryKey: ['connections'] });
  },

  // Invalidate all SmartOLT related queries
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['olts'] });
    queryClient.invalidateQueries({ queryKey: ['onus'] });
    queryClient.invalidateQueries({ queryKey: ['odps'] });
    queryClient.invalidateQueries({ queryKey: ['metrics'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['topology'] });
  },
};

// Prefetch helpers
export const QueryPrefetch = {
  // Prefetch OLTs data
  olts: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.olts,
      staleTime: 1000 * 60, // 1 minute
    });
  },

  // Prefetch metrics data
  metrics: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.metrics(),
      staleTime: 1000 * 30, // 30 seconds
    });
  },

  // Prefetch alerts data
  alerts: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.alerts(),
      staleTime: 1000 * 60, // 1 minute
    });
  },
};

// Query Client Provider Component
interface QueryClientProviderProps {
  children: ReactNode;
  client?: QueryClient;
}

export function SmartOLTQueryProvider({ children, client }: QueryClientProviderProps) {
  const queryClient = client || createQueryClient();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
            position="bottom"
          />
        )}
      </QueryClientProvider>
    </>
  );
}

// Custom error for API failures
export class SmartOLTAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SmartOLTAPIError';
  }
}

// Helper to handle API errors consistently
export function handleAPIError(error: any): SmartOLTAPIError {
  if (error instanceof SmartOLTAPIError) {
    return error;
  }

  if (error?.response?.data) {
    return new SmartOLTAPIError(
      error.response.data.error || error.response.data.message || 'API request failed',
      error.response.status,
      error.response.data.code,
      error.response.data
    );
  }

  if (error instanceof Error) {
    return new SmartOLTAPIError(error.message);
  }

  return new SmartOLTAPIError('An unexpected error occurred');
}

// Real-time polling configuration
export const PollingConfig = {
  // High frequency polling for critical data
  critical: {
    refetchInterval: 1000 * 15, // 15 seconds
    refetchIntervalInBackground: true,
  },

  // Medium frequency polling for regular data
  regular: {
    refetchInterval: 1000 * 30, // 30 seconds
    refetchIntervalInBackground: false,
  },

  // Low frequency polling for static data
  static: {
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    refetchIntervalInBackground: false,
  },

  // Real-time polling for dashboard
  dashboard: {
    refetchInterval: 1000 * 30, // 30 seconds
    refetchIntervalInBackground: true,
    enabled: true, // Enable/disable based on user activity
  },
};

// Visibility-based polling hook
export function useVisibilityBasedPolling(enabled: boolean = true) {
  const [isVisible, setIsVisible] = useState(true);
  const [isUserIdle, setIsUserIdle] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleIdleChange = () => {
      setIsUserIdle(false); // Reset on any user activity
    };

    let idleTimer: NodeJS.Timeout;

    const handleUserActivity = () => {
      clearTimeout(idleTimer);
      setIsUserIdle(false);
      handleIdleChange();

      // Set user as idle after 5 minutes of inactivity
      idleTimer = setTimeout(() => {
        setIsUserIdle(true);
      }, 5 * 60 * 1000);
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    // Initial user activity detection
    handleUserActivity();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearTimeout(idleTimer);
    };
  }, []);

  // Determine if polling should be active
  const shouldPoll = enabled && isVisible && !isUserIdle;

  return {
    shouldPoll,
    isVisible,
    isUserIdle,
  };
}

// Export the singleton query client for server-side usage
let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}