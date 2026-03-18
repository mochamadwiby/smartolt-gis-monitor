import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';

// GET /api/smartolt/olts/[id]/pon-ports - Get PON ports for specific OLT
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oltId = params.id;
    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Try to get from cache first
    const cacheKey = `smartolt:olts:${oltId}:pon_ports`;
    const cachedPorts = await cache.get(cacheKey);

    if (cachedPorts) {
      return NextResponse.json({
        success: true,
        data: cachedPorts,
        oltId,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from SmartOLT API
    const response = await smartoltClient.getOLTPONPortsDetails(oltId);

    if (!response.status) {
      throw new Error(response.error || 'Failed to fetch PON ports');
    }

    // Cache the response
    await cache.set(cacheKey, response.response || [], { ttl: 60 });

    return NextResponse.json({
      success: true,
      data: response.response || [],
      oltId,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[API] Error fetching PON ports for OLT ${params.id}:`, error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      oltId: params.id,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.olts, handler);