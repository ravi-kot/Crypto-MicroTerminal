import { NextRequest } from 'next/server';
import { calculateMetrics } from '@/lib/kv';

export const runtime = 'edge';

/**
 * Metrics endpoint
 * GET /api/metrics
 * Returns current telemetry and model performance
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await calculateMetrics();

    return new Response(JSON.stringify(metrics, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

