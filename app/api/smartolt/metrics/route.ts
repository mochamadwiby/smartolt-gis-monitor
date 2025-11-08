import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';
import { DashboardMetrics, Alert, DeviceStatus } from '@/lib/smartolt-types';

// GET /api/smartolt/metrics - Get dashboard metrics
async function handler(request: NextRequest) {
  try {
    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Try to get from cache first
    const cachedMetrics = await cache.getCachedMetrics();
    if (cachedMetrics) {
      return NextResponse.json({
        success: true,
        data: cachedMetrics,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch data in parallel
    const [oltsResponse, uptimeResponse, onusCoordinatesResponse, outagesResponse] = await Promise.allSettled([
      smartoltClient.getOLTs(),
      smartoltClient.getOLTsUptimeAndEnvTemperature(),
      smartoltClient.getAllONUS_gps_coordinates(),
      // Note: We need to fetch outages for each OLT individually
    ]);

    let olts: any[] = [];
    let uptimeData: any[] = [];
    let onusCoordinates: any[] = [];
    let totalOutages = 0;

    if (oltsResponse.status === 'fulfilled' && oltsResponse.value.status) {
      olts = oltsResponse.value.response || [];
    }

    if (uptimeResponse.status === 'fulfilled' && uptimeResponse.value.status) {
      uptimeData = uptimeResponse.value.response || [];
    }

    if (onusCoordinatesResponse.status === 'fulfilled' && onusCoordinatesResponse.value.status) {
      onusCoordinates = onusCoordinatesResponse.value.response || [];
    }

    // Fetch outages for each OLT
    if (olts.length > 0) {
      const outagePromises = olts.map(async (olt: any) => {
        try {
          const outagesResponse = await smartoltClient.getOLTOutagePons(olt.id);
          if (outagesResponse.status) {
            return outagesResponse.response?.length || 0;
          }
        } catch (error) {
          console.error(`[API] Error fetching outages for OLT ${olt.id}:`, error);
        }
        return 0;
      });

      const outageCounts = await Promise.all(outagePromises);
      totalOutages = outageCounts.reduce((sum, count) => sum + count, 0);
    }

    // Calculate metrics
    const onlineOLTs = uptimeData.filter(olt => olt.uptime && !olt.uptime.includes('0 days')).length;
    const averageTemperature = uptimeData.length > 0
      ? uptimeData.reduce((sum, olt) => {
          const temp = parseFloat(olt.env_temp?.replace(/[^\d.-]/g, '') || '0');
          return sum + temp;
        }, 0) / uptimeData.length
      : undefined;

    // Simulate alert counts (in real implementation, this would come from alert system)
    const alertsCount = {
      critical: totalOutages > 0 ? Math.min(totalOutages, 5) : 0,
      major: Math.max(0, totalOutages - 5),
      minor: Math.floor(onusCoordinates.length * 0.02), // 2% estimated minor issues
      info: 0,
    };

    const metrics: DashboardMetrics = {
      total_olts: olts.length,
      online_olts: onlineOLTs,
      total_onus: onusCoordinates.length,
      online_onus: Math.floor(onusCoordinates.length * 0.95), // Estimate 95% online
      offline_onus: Math.floor(onusCoordinates.length * 0.05), // Estimate 5% offline
      los_onus: totalOutages,
      total_odps: Math.floor(onusCoordinates.length / 8), // Estimate 1 ODP per 8 ONUs
      active_odps: Math.floor(onusCoordinates.length / 8 * 0.98), // Estimate 98% active
      average_temperature: averageTemperature,
      alerts_count: alertsCount,
      last_updated: new Date(),
    };

    // Cache the metrics
    await cache.setCachedMetrics(metrics, 45); // Cache for 45 seconds

    return NextResponse.json({
      success: true,
      data: metrics,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Error fetching dashboard metrics:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.metrics, handler);