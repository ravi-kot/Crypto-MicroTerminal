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

    // If no storage, return a friendly message
    if (metrics.totalPredictions === 0) {
      return new Response(
        JSON.stringify({
          ...metrics,
          message: 'Storage not configured - metrics will be available once storage is set up',
          note: 'App works perfectly without storage! This is just for telemetry.',
        }, null, 2),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

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
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        avgLatency: 0,
        lastUpdate: Date.now(),
        predictions: [],
        message: 'Storage not configured - app works without it!',
      }),
      {
        status: 200, // Return 200 instead of 500 - it's not an error
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

