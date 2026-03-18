import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';

// GET /api/smartolt/onus/[id]/signal - Get signal information for specific ONU
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const onuId = params.id;
    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Try to get from cache first (signal data should be cached for very short time)
    const cacheKey = `smartolt:onus:${onuId}:signal`;
    const cachedSignal = await cache.get(cacheKey);

    if (cachedSignal) {
      return NextResponse.json({
        success: true,
        data: cachedSignal,
        onuId,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from SmartOLT API
    const response = await smartoltClient.getONU_signal(onuId);

    if (!response.status) {
      throw new Error(response.error || 'Failed to fetch ONU signal');
    }

    // Cache signal data for very short time since it changes frequently
    await cache.set(cacheKey, response.response, { ttl: 30 }); // 30 seconds

    return NextResponse.json({
      success: true,
      data: response.response,
      onuId,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[API] Error fetching signal for ONU ${params.id}:`, error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      onuId: params.id,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.onus, handler);