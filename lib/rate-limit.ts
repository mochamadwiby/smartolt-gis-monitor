import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private memoryStore = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Clean up expired entries periodically
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (now > data.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }

  private getKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default key generation using IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return `rate_limit:${ip}`;
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.getKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let record = this.memoryStore.get(key);

    if (!record || now > record.resetTime) {
      // New window
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.memoryStore.set(key, record);
    }

    const success = record.count < this.config.maxRequests;

    return {
      success,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime,
      retryAfter: success ? undefined : Math.ceil((record.resetTime - now) / 1000),
    };
  }

  async increment(request: NextRequest): Promise<RateLimitResult> {
    const key = this.getKey(request);
    const now = Date.now();

    let record = this.memoryStore.get(key);

    if (!record || now > record.resetTime) {
      // New window
      record = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
    } else {
      record.count++;
    }

    this.memoryStore.set(key, record);

    const success = record.count <= this.config.maxRequests;

    return {
      success,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime,
      retryAfter: success ? undefined : Math.ceil((record.resetTime - now) / 1000),
    };
  }

  // Middleware function for Next.js API routes
  middleware() {
    return async (request: NextRequest) => {
      const result = await this.increment(request);

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              'Retry-After': result.retryAfter?.toString() || '60',
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', result.limit.toString());
      headers.set('X-RateLimit-Remaining', result.remaining.toString());
      headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      return { headers };
    };
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Strict limits for critical endpoints
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // Medium limits for regular API endpoints
  medium: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Lenient limits for read-only endpoints
  lenient: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },

  // Very lenient for static/cacheable endpoints
  cacheable: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },
};

// Rate limiters for different endpoint types
export const rateLimiters = {
  olts: new RateLimiter(RateLimitConfigs.medium),
  onus: new RateLimiter(RateLimitConfigs.medium),
  alerts: new RateLimiter(RateLimitConfigs.strict),
  metrics: new RateLimiter(RateLimitConfigs.lenient),
  auth: new RateLimiter(RateLimitConfigs.strict),
  websocket: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30, // WebSocket connections
  }),
};

// Helper function to apply rate limiting to API routes
export function withRateLimit(limiter: RateLimiter, handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // Check rate limit before processing
    const rateLimitResult = await limiter.checkLimit(request);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Execute the handler
    let response;
    try {
      response = await handler(request, ...args);

      // If response is not a NextResponse, wrap it
      if (!(response instanceof NextResponse)) {
        response = NextResponse.json(response);
      }
    } catch (error) {
      // Increment the counter for failed requests if not configured to skip
      if (!limiter['config'].skipFailedRequests) {
        await limiter.increment(request);
      }
      throw error;
    }

    // Increment counter for successful requests if not configured to skip
    if (!limiter['config'].skipSuccessfulRequests) {
      await limiter.increment(request);
    }

    // Add rate limit headers to the response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

    return response;
  };
}

// IP-based rate limiting for API keys
export class APIKeyRateLimiter extends RateLimiter {
  constructor(config: RateLimitConfig) {
    super({
      ...config,
      keyGenerator: (request: NextRequest) => {
        const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
        return apiKey ? `api_key:${apiKey}` : 'anonymous';
      },
    });
  }
}

// Global rate limiter instance for API key authentication
export const apiKeyRateLimiter = new APIKeyRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 1000, // Higher limit for authenticated API key usage
});