/**
 * Feature Engineering Library
 * Pure TypeScript, lightweight indicators for real-time computation
 */

export interface IndicatorState {
  prices: number[];
  timestamps: number[];
  ema12: number;
  ema26: number;
  prevMacd: number;
  prevSignal: number;
  rsiGains: number[];
  rsiLosses: number[];
}

const EMA_ALPHA = (span: number) => 2 / (span + 1);

/**
 * Exponential Moving Average
 */
export function ema(prev: number, price: number, span: number): number {
  const alpha = EMA_ALPHA(span);
  return alpha * price + (1 - alpha) * prev;
}

/**
 * Calculate returns over different time windows
 */
export function calculateReturns(
  prices: number[],
  timestamps: number[],
  currentTime: number
): { r5: number; r15: number; r30: number; r60: number } {
  const now = currentTime;
  const r5 = getReturnAtTime(prices, timestamps, now - 5000);
  const r15 = getReturnAtTime(prices, timestamps, now - 15000);
  const r30 = getReturnAtTime(prices, timestamps, now - 30000);
  const r60 = getReturnAtTime(prices, timestamps, now - 60000);

  return { r5, r15, r30, r60 };
}

function getReturnAtTime(
  prices: number[],
  timestamps: number[],
  targetTime: number
): number {
  if (prices.length === 0 || timestamps.length === 0) return 0;
  
  const currentPrice = prices[prices.length - 1];
  let closestIdx = -1;
  let minDiff = Infinity;

  for (let i = 0; i < timestamps.length; i++) {
    const diff = Math.abs(timestamps[i] - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }

  if (closestIdx === -1 || closestIdx >= prices.length) return 0;
  const pastPrice = prices[closestIdx];
  
  if (pastPrice === 0) return 0;
  return (currentPrice - pastPrice) / pastPrice;
}

/**
 * Calculate rolling volatility (standard deviation of returns)
 */
export function calculateVolatility(
  prices: number[],
  timestamps: number[],
  windowMs: number,
  currentTime: number
): number {
  const cutoff = currentTime - windowMs;
  const returns: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    if (timestamps[i] >= cutoff) {
      const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(ret);
    }
  }

  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    (returns.length - 1);
  
  return Math.sqrt(variance);
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(
  prices: number[],
  period: number = 14
): number {
  if (prices.length < period + 1) return 50; // Neutral

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter((c) => c > 0);
  const losses = recentChanges.filter((c) => c < 0).map((c) => Math.abs(c));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  state: IndicatorState,
  price: number
): { macd: number; signal: number } {
  // Update EMAs
  const newEma12 = ema(state.ema12, price, 12);
  const newEma26 = ema(state.ema26, price, 26);
  
  // MACD line
  const macd = newEma12 - newEma26;
  
  // Signal line (EMA of MACD)
  const signal = ema(state.prevSignal, macd, 9);

  return { macd, signal };
}

/**
 * Calculate Bollinger Bands position (normalized)
 */
export function calculateBollingerPosition(
  prices: number[],
  window: number = 20,
  numStd: number = 2
): number {
  if (prices.length < window) return 0.5; // Neutral position

  const recent = prices.slice(-window);
  const sma = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / recent.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) return 0.5;
  
  const upper = sma + (std * numStd);
  const lower = sma - (std * numStd);
  const currentPrice = prices[prices.length - 1];
  
  // Normalized position: 0 = at lower band, 1 = at upper band
  return (currentPrice - lower) / (upper - lower);
}

/**
 * Compute all indicators from state (enhanced features for neural network)
 */
export function computeIndicators(
  state: IndicatorState,
  currentPrice: number,
  currentTime: number
): {
  r5: number;
  r15: number;
  r30: number;
  r60: number;
  vol30: number;
  vol60: number;
  rsi14: number;
  macd: number;
  signal: number;
  bbPosition: number;
  priceMomentum: number;
  volumeTrend: number;
} {
  const returns = calculateReturns(state.prices, state.timestamps, currentTime);
  const vol30 = calculateVolatility(state.prices, state.timestamps, 30000, currentTime);
  const vol60 = calculateVolatility(state.prices, state.timestamps, 60000, currentTime);
  const rsi14 = calculateRSI(state.prices, 14);
  const { macd, signal } = calculateMACD(state, currentPrice);
  
  // Enhanced features
  const bbPosition = calculateBollingerPosition(state.prices, 20, 2);
  const priceMomentum = returns.r15 || 0; // Use 15s return as momentum proxy
  const volumeTrend = 0; // Volume not available in current stream, set to 0

  return {
    ...returns,
    vol30,
    vol60,
    rsi14,
    macd,
    signal,
    bbPosition,
    priceMomentum,
    volumeTrend,
  };
}

/**
 * Initialize indicator state
 */
export function initIndicatorState(): IndicatorState {
  return {
    prices: [],
    timestamps: [],
    ema12: 0,
    ema26: 0,
    prevMacd: 0,
    prevSignal: 0,
    rsiGains: [],
    rsiLosses: [],
  };
}

/**
 * Update state with new price
 */
export function updateState(
  state: IndicatorState,
  price: number,
  timestamp: number,
  maxHistory: number = 100
): IndicatorState {
  const newState = { ...state };
  
  newState.prices.push(price);
  newState.timestamps.push(timestamp);

  // Keep only last N prices
  if (newState.prices.length > maxHistory) {
    newState.prices.shift();
    newState.timestamps.shift();
  }

  // Initialize EMAs with first price
  if (newState.prices.length === 1) {
    newState.ema12 = price;
    newState.ema26 = price;
  } else {
    newState.ema12 = ema(newState.ema12, price, 12);
    newState.ema26 = ema(newState.ema26, price, 26);
  }

  // Update MACD and signal
  const { macd, signal } = calculateMACD(newState, price);
  newState.prevMacd = macd;
  newState.prevSignal = signal;

  return newState;
}

