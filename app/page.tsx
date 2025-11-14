'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface Tick {
  t: number;
  price: number;
  r5?: number;
  r15?: number;
  r30?: number;
  r60?: number;
  vol30?: number;
  vol60?: number;
  rsi14?: number;
  macd?: number;
  signal?: number;
  bbPosition?: number;
  priceMomentum?: number;
  volumeTrend?: number;
  pred?: {
    prob: number;
    label: number;
  };
}

interface PricePoint {
  time: string;
  price: number;
  timestamp: number;
}

export default function Home() {
  const [latest, setLatest] = useState<Tick | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [historicalData, setHistoricalData] = useState<PricePoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [futureDays, setFutureDays] = useState(7);
  const [predictedPrices, setPredictedPrices] = useState<PricePoint[]>([]);
  const featsRef = useRef<number[]>([]);
  const maxHistoryPoints = 100;

  // Fetch historical data on mount
  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        const response = await fetch('/api/history?hours=24');
        if (response.ok) {
          const data = await response.json();
          setHistoricalData(data);
        }
      } catch (err) {
        console.error('Failed to fetch historical data:', err);
      }
    };
    fetchHistorical();
  }, []);

  // Calculate future predictions based on actual volatility patterns
  useEffect(() => {
    if (!latest?.price || !latest?.pred) return;

    const currentPrice = latest.price;
    const prob = latest.pred.prob;
    const trend = prob > 0.5 ? 1 : -1;
    const confidence = Math.abs(prob - 0.5) * 2; // 0 to 1

    // Calculate actual volatility from historical data
    const allPrices = [...historicalData, ...priceHistory].map(p => p.price);
    let volatility = 0.03; // Default 3% daily
    
    if (allPrices.length > 10) {
      const returns = [];
      for (let i = 1; i < allPrices.length; i++) {
        returns.push((allPrices[i] - allPrices[i - 1]) / allPrices[i - 1]);
      }
      const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
      volatility = Math.sqrt(variance) * Math.sqrt(24); // Annualize hourly to daily
      volatility = Math.min(Math.max(volatility, 0.01), 0.1); // Clamp between 1% and 10%
    } else if (latest.vol30) {
      volatility = Math.min(Math.max(latest.vol30 * 100 * 24, 0.01), 0.1);
    }

    // Generate realistic predictions with random walk + trend
    const predictions: PricePoint[] = [];
    let lastPrice = currentPrice;
    
    for (let day = 1; day <= futureDays; day++) {
      // Random walk component (realistic market movement)
      const randomWalk = (Math.random() - 0.5) * 2 * volatility * 0.5;
      // Trend component (based on model prediction)
      const trendComponent = trend * confidence * volatility * 0.3;
      // Mean reversion (slight pullback)
      const meanReversion = (currentPrice - lastPrice) / currentPrice * 0.1;
      
      const totalChange = randomWalk + trendComponent - meanReversion;
      lastPrice = lastPrice * (1 + totalChange);
      
      // Ensure reasonable bounds
      lastPrice = Math.max(lastPrice, currentPrice * 0.7);
      lastPrice = Math.min(lastPrice, currentPrice * 1.5);
      
      predictions.push({
        time: `+${day}d`,
        price: lastPrice,
        timestamp: Date.now() + day * 86400000,
        type: 'predicted',
      });
    }

    setPredictedPrices(predictions);
  }, [latest, futureDays, historicalData, priceHistory]);

  useEffect(() => {
    const es = new EventSource('/api/stream');
    
    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = async (e) => {
      try {
        const tick: Tick = JSON.parse(e.data);
        if (tick.type === 'tick' && tick.price) {
          setLatest(tick);

          // Update price history
          setPriceHistory((prev) => {
            const newPoint: PricePoint = {
              time: new Date(tick.t).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              }),
              price: tick.price,
              timestamp: tick.t,
            };
            const updated = [...prev, newPoint];
            // Keep only last N points
            return updated.slice(-maxHistoryPoints);
          });

          // Build enhanced feature vector (match neural network training order)
          // Features: [r5, r15, r30, r60, vol30, vol60, rsi14, macd, bb_position, price_momentum, volume_trend]
          if (tick.r5 !== undefined && tick.r15 !== undefined && tick.r30 !== undefined) {
            const feats = [
              tick.r5 || 0,
              tick.r15 || 0,
              tick.r30 || 0,
              tick.r60 || 0,
              tick.vol30 || 0,
              tick.vol60 || 0,
              (tick.rsi14 || 50) / 100.0, // Normalize RSI to 0-1
              (tick.macd || 0) / (tick.price || 1), // Normalize MACD by price
              tick.bbPosition || 0.5,
              tick.priceMomentum || 0,
              tick.volumeTrend || 0,
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

  // Combine historical and predicted data for chart
  const allHistorical = [
    ...historicalData.map((p) => ({ ...p, type: 'historical', historicalPrice: p.price, predictedPrice: null })),
    ...priceHistory.map((p) => ({ ...p, type: 'realtime', historicalPrice: p.price, predictedPrice: null })),
  ];
  
  // Combine all data - use separate keys for Area (historical) and Line (predicted)
  const lastHistorical = allHistorical[allHistorical.length - 1];
  const firstPredicted = predictedPrices[0];
  
  const chartData = [
    ...allHistorical,
    // Bridge point to connect historical to predicted
    ...(lastHistorical && firstPredicted 
      ? [{ 
          time: 'Now', 
          price: lastHistorical.price,
          historicalPrice: lastHistorical.price,
          predictedPrice: firstPredicted.price,
          timestamp: Date.now(), 
          type: 'bridge',
        }]
      : []),
    ...predictedPrices.map((p) => ({ 
      ...p, 
      historicalPrice: null,
      predictedPrice: p.price,
    })),
  ];

  const prob = latest?.pred?.prob || 0;
  const probPercent = (prob * 100).toFixed(1);
  const isBullish = prob > 0.5;
  const confidence = Math.abs(prob - 0.5) * 2;

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-black" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-24">
          {/* Header */}
          <header className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight mb-3">
                  Crypto
                  <span className="block font-medium bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Micro-Terminal
                  </span>
                </h1>
                <p className="text-xl text-gray-400 font-light">
                  Real-time prediction powered by edge inference
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-400 font-light">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </header>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Current Price */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-2 font-light">Current Price</div>
              <div className="text-4xl font-light mb-1">
                ${latest?.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}
              </div>
              <div className="text-xs text-gray-500 font-light">
                {latest?.t ? new Date(latest.t).toLocaleTimeString() : '--'}
              </div>
            </div>

            {/* Prediction */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-2 font-light">Next Minute</div>
              <div className={`text-4xl font-light mb-1 ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                {latest?.pred ? (isBullish ? '↑ UP' : '↓ DOWN') : '--'}
              </div>
              <div className="text-xs text-gray-500 font-light">
                {probPercent}% confidence
              </div>
            </div>

            {/* Probability Bar */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-4 font-light">Probability</div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isBullish ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                  style={{ width: `${prob * 100}%` }}
                />
                <div 
                  className="absolute inset-y-0 right-0 transition-all duration-500 bg-gradient-to-l from-red-500 to-rose-400"
                  style={{ width: `${(1 - prob) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Down {((1 - prob) * 100).toFixed(1)}%</span>
                <span>Up {probPercent}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-light mb-1">Price Forecast</h2>
                <p className="text-sm text-gray-400 font-light">Historical and predicted prices</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-400 font-light">
                  Forecast Days:
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={futureDays}
                  onChange={(e) => setFutureDays(Number(e.target.value))}
                  className="w-32 accent-blue-500"
                />
                <span className="text-sm font-light w-8">{futureDays}d</span>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.4)"
                    style={{ fontSize: '12px', fontFamily: 'system-ui' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)"
                    style={{ fontSize: '12px', fontFamily: 'system-ui' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="historicalPrice"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorHistorical)"
                    isAnimationActive={false}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedPrice"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#a855f7', r: 2 }}
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
                  <p className="font-light">Loading price data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Indicators Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-xs text-gray-400 mb-2 font-light">RSI (14)</div>
              <div className="text-2xl font-light">{latest?.rsi14?.toFixed(1) || '--'}</div>
              <div className="text-xs text-gray-500 mt-1 font-light">
                {latest?.rsi14 ? (latest.rsi14 > 70 ? 'Overbought' : latest.rsi14 < 30 ? 'Oversold' : 'Neutral') : '--'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-xs text-gray-400 mb-2 font-light">MACD</div>
              <div className="text-2xl font-light">{latest?.macd?.toFixed(4) || '--'}</div>
              <div className="text-xs text-gray-500 mt-1 font-light">
                {latest?.macd ? (latest.macd > 0 ? 'Bullish' : 'Bearish') : '--'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-xs text-gray-400 mb-2 font-light">Volatility</div>
              <div className="text-2xl font-light">
                {latest?.vol30 ? (latest.vol30 * 100).toFixed(3) : '--'}%
              </div>
              <div className="text-xs text-gray-500 mt-1 font-light">30s window</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-xs text-gray-400 mb-2 font-light">Confidence</div>
              <div className="text-2xl font-light">{(confidence * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1 font-light">Model certainty</div>
            </div>
          </div>

          {/* Future Predictions Table */}
          {predictedPrices.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h2 className="text-2xl font-light mb-6">Future Price Projections</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {predictedPrices.slice(0, 7).map((point, idx) => {
                  const change = latest?.price ? ((point.price - latest.price) / latest.price) * 100 : 0;
                  return (
                    <div key={idx} className="text-center">
                      <div className="text-xs text-gray-400 mb-2 font-light">Day {idx + 1}</div>
                      <div className="text-lg font-light mb-1">
                        ${point.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="font-light">
                Powered by Vercel Edge • Real-time inference
              </div>
              <a
                href="/api/metrics"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors font-light"
              >
                View Metrics →
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
