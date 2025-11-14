'use client';

import { useEffect, useRef, useState } from 'react';

interface Tick {
  t: number;
  price: number;
  r5?: number;
  r15?: number;
  r30?: number;
  vol30?: number;
  rsi14?: number;
  macd?: number;
  signal?: number;
  pred?: {
    prob: number;
    label: number;
  };
}

export default function Home() {
  const [latest, setLatest] = useState<Tick | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const featsRef = useRef<number[]>([]);

  useEffect(() => {
    const es = new EventSource('/api/stream');
    
    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = async (e) => {
      try {
        const tick: Tick = JSON.parse(e.data);
        setLatest(tick);

        // Build feature vector (match training order)
        if (tick.r5 !== undefined && tick.r15 !== undefined && tick.r30 !== undefined) {
          const feats = [
            tick.r5 || 0,
            tick.r15 || 0,
            tick.r30 || 0,
            tick.vol30 || 0,
            tick.rsi14 || 50,
            tick.macd || 0,
          ];
          featsRef.current = feats;

          // Get prediction
          try {
            const res = await fetch('/api/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ features: feats }),
            });
            const pred = await res.json();
            setLatest((p: Tick | null) => p ? { ...p, pred } : null);
          } catch (err) {
            console.error('Prediction error:', err);
          }
        }
      } catch (err) {
        console.error('Parse error:', err);
        setError('Failed to parse tick data');
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      setError('Connection error - reconnecting...');
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, []);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Crypto Micro-Terminal</h1>
          <p className="text-gray-400">Real-time BTC/ETH prediction with edge inference</p>
          <div className="mt-4 flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            {error && <span className="text-sm text-red-400">{error}</span>}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Price Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Current Price</h2>
            <div className="text-3xl font-bold text-green-400">
              ${latest?.price?.toFixed(2) || '--'}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {latest?.t ? new Date(latest.t).toLocaleTimeString() : '--'}
            </div>
          </div>

          {/* Prediction Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Prediction</h2>
            <div className="text-3xl font-bold">
              {latest?.pred ? (
                <span className={latest.pred.prob > 0.5 ? 'text-green-400' : 'text-red-400'}>
                  {latest.pred.prob > 0.5 ? '↑ UP' : '↓ DOWN'}
                </span>
              ) : (
                '--'
              )}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Probability: {(latest?.pred?.prob ? latest.pred.prob * 100 : 0).toFixed(1)}%
            </div>
          </div>

          {/* Indicators Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Indicators</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">RSI(14):</span>
                <span>{latest?.rsi14?.toFixed(2) || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MACD:</span>
                <span>{latest?.macd?.toFixed(4) || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility (30s):</span>
                <span>{latest?.vol30?.toFixed(6) || '--'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Link */}
        <div className="mt-8">
          <a
            href="/api/metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            View Live Metrics →
          </a>
        </div>
      </div>
    </main>
  );
}

