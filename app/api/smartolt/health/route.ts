import { NextRequest, NextResponse } from 'next/server';
import { createSmartOLTClientFromEnv } from '@/lib/smartolt-client';
import { getCacheManager } from '@/lib/cache';

// GET /api/smartolt/health - Health check for SmartOLT integration
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const smartoltClient = createSmartOLTClientFromEnv();
    const cache = getCacheManager();

    // Check SmartOLT API connection
    const apiConnection = await smartoltClient.testConnection();

    // Check cache provider
    let cacheConnection = false;
    try {
      await cache.set('health_check', 'ok', { ttl: 10 });
      const cached = await cache.get('health_check');
      cacheConnection = cached === 'ok';
      await cache.invalidate('health_check');
    } catch (cacheError) {
      console.error('[Health] Cache connection failed:', cacheError);
    }

    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      services: {
        smartolt_api: {
          status: apiConnection ? 'connected' : 'disconnected',
          response_time: responseTime,
        },
        cache: {
          status: cacheConnection ? 'connected' : 'disconnected',
        },
      },
      environment: {
        node_env: process.env.NODE_ENV,
        has_smartolt_config: !!(process.env.SMARTOLT_SUBDOMAIN && process.env.SMARTOLT_API_KEY),
        has_redis_config: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      },
    };

    // Determine overall health status
    if (!apiConnection) {
      health.status = 'degraded';
    }

    if (!cacheConnection) {
      health.status = health.status === 'degraded' ? 'unhealthy' : 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('[Health] Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        smartolt_api: { status: 'error' },
        cache: { status: 'unknown' },
      },
    }, { status: 503 });
  }
}