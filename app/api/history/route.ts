import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Fetch historical price data from CoinGecko
 * Returns last N hours of price data for charting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    
    // CoinGecko market chart endpoint - returns hourly data
    // For 24 hours, we get hourly candles
    const days = Math.ceil(hours / 24);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=hourly`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract prices from the response
    // Format: { prices: [[timestamp, price], ...], market_caps: [...], total_volumes: [...] }
    const prices = data.prices || [];
    
    // Convert to our format and limit to requested hours
    const priceData = prices
      .slice(-hours) // Get last N hours
      .map(([timestamp, price]: [number, number]) => ({
        time: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        price: price,
        timestamp: timestamp,
        type: 'historical',
      }));

    return new Response(JSON.stringify(priceData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch historical data' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

