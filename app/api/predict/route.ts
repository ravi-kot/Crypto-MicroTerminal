import { NextRequest } from 'next/server';
import { predict } from '@/lib/model';
import { logPrediction } from '@/lib/kv';

export const runtime = 'edge';

/**
 * Prediction endpoint
 * POST /api/predict
 * Body: { features: number[], y_true?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const t0 = Date.now();
    const body = await request.json();
    const { features, y_true } = body;

    if (!Array.isArray(features)) {
      return new Response(
        JSON.stringify({ error: 'features must be an array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get prediction
    const { prob, label } = await predict(features);

    // Log to KV (async, don't wait)
    const latency = Date.now() - t0;
    logPrediction({
      timestamp: Date.now(),
      prob,
      label,
      y_true,
      ms: latency,
    }).catch((err) => console.error('Failed to log prediction:', err));

    return new Response(
      JSON.stringify({
        prob,
        label,
        latency_ms: latency,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Prediction error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Prediction failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

