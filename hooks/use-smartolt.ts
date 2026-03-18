'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { QueryKeys, QueryInvalidation, handleAPIError, PollingConfig, useVisibilityBasedPolling } from '@/lib/query-client';

// Base API function
async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`/api/smartolt${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw handleAPIError({
      response: {
        status: response.status,
        data: await response.json().catch(() => ({})),
      },
    });
  }

  return response.json();
}

// OLT Hooks
export function useOLTs(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.olts,
    queryFn: () => fetchFromAPI('/olts'),
    ...PollingConfig.regular,
    enabled: options.enabled !== false && shouldPoll,
    refetchInterval: options.refetchInterval || PollingConfig.regular.refetchInterval,
  });
}

export function useOLTDetails(oltId: string, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.oltDetails(oltId),
    queryFn: () => fetchFromAPI(`/olts/${oltId}/details`),
    enabled: !!oltId && options.enabled !== false && shouldPoll,
    ...PollingConfig.regular,
  });
}

export function useOLTPONPorts(oltId: string, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.oltPONPorts(oltId),
    queryFn: () => fetchFromAPI(`/olts/${oltId}/pon-ports`),
    enabled: !!oltId && options.enabled !== false && shouldPoll,
    ...PollingConfig.regular,
  });
}

export function useOLTOutages(oltId: string, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.oltOutages(oltId),
    queryFn: () => fetchFromAPI(`/olts/${oltId}/outages`),
    enabled: !!oltId && options.enabled !== false && shouldPoll,
    ...PollingConfig.critical, // Outages are critical data
  });
}

export function useOLTUptimeAndTemperature(options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.oltUptime(),
    queryFn: () => fetchFromAPI('/olts/uptime-temperature'),
    enabled: options.enabled !== false && shouldPoll,
    ...PollingConfig.regular,
  });
}

// ONU Hooks
export function useONUSearch(filters?: {
  olt_id?: string;
  board?: string;
  port?: string;
  zone?: string;
  status?: string;
}, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters?.olt_id) params.set('olt_id', filters.olt_id);
    if (filters?.board) params.set('board', filters.board);
    if (filters?.port) params.set('port', filters.port);
    if (filters?.zone) params.set('zone', filters.zone);
    if (filters?.status) params.set('status', filters.status);
    return params.toString();
  }, [filters]);

  return useQuery({
    queryKey: QueryKeys.onuStatuses(filters),
    queryFn: () => fetchFromAPI(`/onus/statuses${queryString ? `?${queryString}` : ''}`),
    enabled: options.enabled !== false && shouldPoll,
    ...PollingConfig.regular,
  });
}

export function useONUCoordinates(filters?: {
  olt_id?: string;
  board?: string;
  port?: string;
  zone?: string;
}, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters?.olt_id) params.set('olt_id', filters.olt_id);
    if (filters?.board) params.set('board', filters.board);
    if (filters?.port) params.set('port', filters.port);
    if (filters?.zone) params.set('zone', filters.zone);
    return params.toString();
  }, [filters]);

  return useQuery({
    queryKey: QueryKeys.onuCoordinates(filters),
    queryFn: () => fetchFromAPI(`/onus/coordinates${queryString ? `?${queryString}` : ''}`),
    enabled: options.enabled !== false && shouldPoll,
    ...PollingConfig.static, // Coordinates don't change frequently
  });
}

export function useONUDetails(onuId: string, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.onuDetails(onuId),
    queryFn: () => fetchFromAPI(`/onus/${onuId}/details`),
    enabled: !!onuId && options.enabled !== false && shouldPoll,
    ...PollingConfig.regular,
  });
}

export function useONUSignal(onuId: string, options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.onuSignal(onuId),
    queryFn: () => fetchFromAPI(`/onus/${onuId}/signal`),
    enabled: !!onuId && options.enabled !== false && shouldPoll,
    ...PollingConfig.critical, // Signal data is critical
  });
}

// Dashboard Metrics Hook
export function useDashboardMetrics(options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);

  return useQuery({
    queryKey: QueryKeys.metrics(),
    queryFn: () => fetchFromAPI('/metrics'),
    enabled: options.enabled !== false && shouldPoll,
    ...PollingConfig.dashboard,
  });
}

// Health Check Hook
export function useHealthCheck(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: QueryKeys.health(),
    queryFn: () => fetchFromAPI('/health'),
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval || 60000, // Check health every minute
    retry: 1, // Only retry health checks once
  });
}

// Network Topology Hook
export function useNetworkTopology(options: { enabled?: boolean } = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);
  const queryClient = useQueryClient();

  // Combine multiple queries to build topology
  const oltsQuery = useOLTs({ enabled: options.enabled });
  const onusCoordinatesQuery = useONUCoordinates({}, { enabled: options.enabled });
  const onusStatusesQuery = useONUSearch({}, { enabled: options.enabled });

  return useQuery({
    queryKey: QueryKeys.topology(),
    queryFn: async () => {
      const [oltsData, onusCoordinatesData, onusStatusesData] = await Promise.all([
        fetchFromAPI('/olts'),
        fetchFromAPI('/onus/coordinates'),
        fetchFromAPI('/onus/statuses'),
      ]);

      // Merge coordinates with status data
      const mergedONUS = onusCoordinatesData.data?.map((onu: any) => {
        const status = onusStatusesData.data?.find((s: any) => s.external_id === onu.unique_external_id);
        return {
          ...onu,
          status: status?.status || 'unknown',
          lastSeen: status?.last_seen,
        };
      }) || [];

      return {
        olts: oltsData.data || [],
        onus: mergedONUS,
        connections: [], // TODO: Fetch connections from database
        lastUpdated: new Date().toISOString(),
      };
    },
    enabled: options.enabled !== false && shouldPoll,
    ...PollingConfig.regular,
  });
}

// Alert Hooks
export function useAlerts(options: {
  level?: string;
  acknowledged?: boolean;
  resolved?: boolean;
  enabled?: boolean;
} = {}) {
  const { shouldPoll } = useVisibilityBasedPolling(options.enabled);
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (options.level) params.set('level', options.level);
    if (options.acknowledged !== undefined) params.set('acknowledged', options.acknowledged.toString());
    if (options.resolved !== undefined) params.set('resolved', options.resolved.toString());
    return params.toString();
  }, [options]);

  return useQuery({
    queryKey: QueryKeys.alerts(),
    queryFn: () => fetchFromAPI(`/alerts${queryString ? `?${queryString}` : ''}`),
    enabled: options.enabled !== false && shouldPoll,
    ...PollingConfig.critical, // Alerts are critical
  });
}

// Real-time monitoring hook
export function useRealTimeMonitoring(enabled: boolean = true) {
  const metrics = useDashboardMetrics({ enabled });
  const alerts = useAlerts({ resolved: false, enabled });
  const health = useHealthCheck({ enabled });
  const { shouldPoll } = useVisibilityBasedPolling(enabled);

  const criticalAlerts = useMemo(() => {
    return alerts.data?.filter((alert: any) => alert.level === 'critical') || [];
  }, [alerts.data]);

  const hasIssues = useMemo(() => {
    return (
      !health.data ||
      health.data.status !== 'healthy' ||
      criticalAlerts.length > 0 ||
      (metrics.data && (
        metrics.data.alerts_count.critical > 0 ||
        metrics.data.offline_onus > metrics.data.total_onus * 0.1 // >10% offline
      ))
    );
  }, [health.data, criticalAlerts, metrics.data]);

  return {
    metrics,
    alerts,
    health,
    criticalAlerts,
    hasIssues,
    shouldPoll,
  };
}

// Mutation Hooks
export function useRefreshOLTs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchFromAPI('/olts', { method: 'POST' }),
    onSuccess: () => {
      QueryInvalidation.olts(queryClient);
      QueryInvalidation.metrics(queryClient);
    },
  });
}

export function useRefreshMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchFromAPI('/metrics/refresh', { method: 'POST' }),
    onSuccess: () => {
      QueryInvalidation.metrics(queryClient);
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      return fetchFromAPI(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
    },
    onSuccess: () => {
      QueryInvalidation.alerts(queryClient);
      QueryInvalidation.metrics(queryClient);
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, resolution }: { alertId: string; resolution: string }) => {
      return fetchFromAPI(`/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
    },
    onSuccess: () => {
      QueryInvalidation.alerts(queryClient);
      QueryInvalidation.metrics(queryClient);
    },
  });
}

// Utility hooks
export function useDeviceStats(deviceType: 'olt' | 'onu' | 'odp') {
  const metrics = useDashboardMetrics();

  return useMemo(() => {
    if (!metrics.data) return null;

    switch (deviceType) {
      case 'olt':
        return {
          total: metrics.data.total_olts,
          online: metrics.data.online_olts,
          offline: metrics.data.total_olts - metrics.data.online_olts,
          healthPercentage: (metrics.data.online_olts / metrics.data.total_olts) * 100,
        };

      case 'onu':
        return {
          total: metrics.data.total_onus,
          online: metrics.data.online_onus,
          offline: metrics.data.offline_onus,
          los: metrics.data.los_onus,
          healthPercentage: (metrics.data.online_onus / metrics.data.total_onus) * 100,
        };

      case 'odp':
        return {
          total: metrics.data.total_odps,
          active: metrics.data.active_odps,
          inactive: metrics.data.total_odps - metrics.data.active_odps,
          healthPercentage: (metrics.data.active_odps / metrics.data.total_odps) * 100,
        };

      default:
        return null;
    }
  }, [metrics.data, deviceType]);
}

export function useSmartOLTPollingIntervals() {
  return {
    metrics: PollingConfig.dashboard.refetchInterval,
    alerts: PollingConfig.critical.refetchInterval,
    devices: PollingConfig.regular.refetchInterval,
    health: 60000, // 1 minute for health checks
  };
}