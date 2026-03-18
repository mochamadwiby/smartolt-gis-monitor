import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';

// GET /api/smartolt/olts/[id]/outages - Get outage PONs for specific OLT
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oltId = params.id;
    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Try to get from cache first (outage data should be cached for shorter time)
    const cacheKey = `smartolt:olts:${oltId}:outages`;
    const cachedOutages = await cache.get(cacheKey);

    if (cachedOutages) {
      return NextResponse.json({
        success: true,
        data: cachedOutages,
        oltId,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from SmartOLT API
    const response = await smartoltClient.getOLTOutagePons(oltId);

    if (!response.status) {
      throw new Error(response.error || 'Failed to fetch outage PONs');
    }

    // Cache the response for shorter time since outages change frequently
    await cache.set(cacheKey, response.response || [], { ttl: 30 });

    return NextResponse.json({
      success: true,
      data: response.response || [],
      oltId,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[API] Error fetching outages for OLT ${params.id}:`, error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      oltId: params.id,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.olts, handler);