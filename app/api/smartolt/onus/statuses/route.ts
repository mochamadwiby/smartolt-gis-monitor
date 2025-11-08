import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';

// GET /api/smartolt/onus/statuses - Get ONU statuses
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const oltId = searchParams.get('olt_id');
    const board = searchParams.get('board');
    const port = searchParams.get('port');
    const zone = searchParams.get('zone');

    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Create cache key based on parameters
    const paramsString = [oltId, board, port, zone].filter(Boolean).join(':');
    const cacheKey = `smartolt:onus:statuses${paramsString ? `:${paramsString}` : ''}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        params: { oltId, board, port, zone },
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from SmartOLT API
    const params: any = {};
    if (oltId) params.olt_id = oltId;
    if (board) params.board = board;
    if (port) params.port = port;
    if (zone) params.zone = zone;

    const response = await smartoltClient.getONUS_statuses(params);

    if (!response.status) {
      throw new Error(response.error || 'Failed to fetch ONU statuses');
    }

    // Cache status data for shorter period as it changes frequently
    await cache.set(cacheKey, response.response || [], { ttl: 45 }); // 45 seconds

    return NextResponse.json({
      success: true,
      data: response.response || [],
      params: { oltId, board, port, zone },
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Error fetching ONU statuses:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.onus, handler);