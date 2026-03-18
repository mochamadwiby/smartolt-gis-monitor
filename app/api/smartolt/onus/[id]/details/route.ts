import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';

// GET /api/smartolt/onus/[id]/details - Get detailed information for specific ONU
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const onuId = params.id;
    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Try to get from cache first
    const cacheKey = `smartolt:onus:${onuId}:details`;
    const cachedDetails = await cache.get(cacheKey);

    if (cachedDetails) {
      return NextResponse.json({
        success: true,
        data: cachedDetails,
        onuId,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from SmartOLT API
    const response = await smartoltClient.getONU_details(onuId);

    if (!response.status) {
      throw new Error(response.error || 'Failed to fetch ONU details');
    }

    // Cache the response
    await cache.set(cacheKey, response.response, { ttl: 120 }); // 2 minutes

    return NextResponse.json({
      success: true,
      data: response.response,
      onuId,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[API] Error fetching details for ONU ${params.id}:`, error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      onuId: params.id,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.onus, handler);