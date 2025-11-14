import { NextRequest } from 'next/server';
import { initIndicatorState, updateState, computeIndicators } from '@/lib/features';

export const runtime = 'edge';

interface PriceData {
  bitcoin?: { usd?: number };
  ethereum?: { usd?: number };
}

/**
 * Fetch current BTC price from CoinGecko
 */
async function fetchPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      {
        cache: 'no-store',
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: PriceData = await response.json();
    return data.bitcoin?.usd || 0;
  } catch (error) {
    console.error('Failed to fetch price:', error);
    // Fallback: return 0 or last known price
    return 0;
  }
}

/**
 * SSE Stream endpoint for real-time price and indicators
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let indicatorState = initIndicatorState();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      send({ type: 'connected', t: Date.now() });

      // Fetch initial price
      let lastPrice = await fetchPrice();
      if (lastPrice > 0) {
        const now = Date.now();
        indicatorState = updateState(indicatorState, lastPrice, now);
        const indicators = computeIndicators(indicatorState, lastPrice, now);
        
        send({
          type: 'tick',
          t: now,
          price: lastPrice,
          ...indicators,
        });
      }

      // Poll every 3 seconds
      const intervalId = setInterval(async () => {
        try {
          const price = await fetchPrice();
          if (price > 0) {
            const now = Date.now();
            indicatorState = updateState(indicatorState, price, now);
            const indicators = computeIndicators(indicatorState, price, now);

            send({
              type: 'tick',
              t: now,
              price,
              ...indicators,
            });
          }
        } catch (error) {
          console.error('Error in stream:', error);
          send({ type: 'error', message: 'Failed to fetch price' });
        }
      }, 3000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });

      // Close stream after 1 hour (Vercel Edge timeout)
      setTimeout(() => {
        clearInterval(intervalId);
        send({ type: 'closed', message: 'Stream closed after 1 hour' });
        controller.close();
      }, 3600000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}

