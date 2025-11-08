import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';
import { withRateLimit } from '@/lib/rate-limit';

// GET /api/smartolt/olts - Get all OLTs
async function handler(request: NextRequest) {
  try {
    const cache = getCacheManager();
    const smartoltClient = createSmartOLTClientFromEnv();

    // Try to get from cache first
    const cachedOLTs = await cache.getCachedOLTs();
    if (cachedOLTs) {
      return NextResponse.json({
        success: true,
        data: cachedOLTs,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from SmartOLT API
    const response = await smartoltClient.getOLTs();

    if (!response.status) {
      throw new Error(response.error || 'Failed to fetch OLTs');
    }

    // Cache the response
    await cache.setCachedOLTs(response.response || [], 60); // Cache for 60 seconds

    return NextResponse.json({
      success: true,
      data: response.response || [],
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Error fetching OLTs:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = withRateLimit(rateLimiters.olts, handler);

// POST /api/smartolt/olts/refresh - Force refresh OLTs cache
export async function POST(request: NextRequest) {
  try {
    const cache = getCacheManager();

    // Clear OLTs cache
    await cache.invalidate('smartolt:olts:*');

    // Fetch fresh data
    const smartoltClient = createSmartOLTClientFromEnv();
    const response = await smartoltClient.getOLTs();

    if (!response.status) {
      throw new Error(response.error || 'Failed to refresh OLTs');
    }

    // Cache fresh data
    await cache.setCachedOLTs(response.response || [], 60);

    return NextResponse.json({
      success: true,
      data: response.response || [],
      cached: false,
      timestamp: new Date().toISOString(),
      message: 'OLTs cache refreshed successfully',
    });

  } catch (error) {
    console.error('[API] Error refreshing OLTs:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}