/**
 * Vercel KV (Upstash) Helper Functions
 * Telemetry and metrics storage
 */

import { kv } from '@vercel/kv';

export interface PredictionLog {
  timestamp: number;
  prob: number;
  label: number;
  y_true?: number; // Actual outcome (for backtesting)
  ms: number; // Latency in milliseconds
}

export interface Metrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  avgLatency: number;
  lastUpdate: number;
  predictions: PredictionLog[];
}

const PREDICTIONS_KEY = 'predictions';
const METRICS_KEY = 'metrics';
const MAX_PREDICTIONS = 1000; // Keep last 1000 predictions

/**
 * Log a prediction to KV
 */
export async function logPrediction(log: PredictionLog): Promise<void> {
  try {
    // Add to predictions list (keep last N)
    const key = `${PREDICTIONS_KEY}:${Date.now()}`;
    await kv.set(key, log, { ex: 86400 }); // Expire after 24h

    // Also maintain a sorted set for quick access
    await kv.zadd(PREDICTIONS_KEY, Date.now(), JSON.stringify(log));

    // Trim old predictions
    const count = await kv.zcard(PREDICTIONS_KEY);
    if (count > MAX_PREDICTIONS) {
      const toRemove = count - MAX_PREDICTIONS;
      await kv.zremrangebyrank(PREDICTIONS_KEY, 0, toRemove - 1);
    }
  } catch (error) {
    console.error('Failed to log prediction:', error);
    // Don't throw - telemetry failures shouldn't break the app
  }
}

/**
 * Get recent predictions
 */
export async function getRecentPredictions(limit: number = 100): Promise<PredictionLog[]> {
  try {
    const results = await kv.zrange(PREDICTIONS_KEY, -limit, -1, {
      rev: true,
    });
    return results.map((r) => JSON.parse(r as string)) as PredictionLog[];
  } catch (error) {
    console.error('Failed to get predictions:', error);
    return [];
  }
}

/**
 * Calculate current metrics
 */
export async function calculateMetrics(): Promise<Metrics> {
  try {
    const predictions = await getRecentPredictions(MAX_PREDICTIONS);
    
    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        avgLatency: 0,
        lastUpdate: Date.now(),
        predictions: [],
      };
    }

    // Calculate accuracy (only for predictions with y_true)
    const withLabels = predictions.filter((p) => p.y_true !== undefined);
    const correct = withLabels.filter((p) => p.label === p.y_true).length;
    const accuracy = withLabels.length > 0 ? correct / withLabels.length : 0;

    // Calculate average latency
    const avgLatency =
      predictions.reduce((sum, p) => sum + p.ms, 0) / predictions.length;

    return {
      totalPredictions: predictions.length,
      correctPredictions: correct,
      accuracy,
      avgLatency,
      lastUpdate: Date.now(),
      predictions: predictions.slice(0, 100), // Return last 100 for display
    };
  } catch (error) {
    console.error('Failed to calculate metrics:', error);
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      avgLatency: 0,
      lastUpdate: Date.now(),
      predictions: [],
    };
  }
}

/**
 * Store aggregated metrics (for hourly rollups)
 */
export async function storeMetrics(metrics: Metrics): Promise<void> {
  try {
    const key = `${METRICS_KEY}:${Date.now()}`;
    await kv.set(key, metrics, { ex: 604800 }); // Expire after 7 days
  } catch (error) {
    console.error('Failed to store metrics:', error);
  }
}

/**
 * Get stored metrics history
 */
export async function getMetricsHistory(limit: number = 24): Promise<Metrics[]> {
  try {
    // This would require scanning keys, which is not ideal
    // For now, return empty array - can be enhanced with a sorted set
    return [];
  } catch (error) {
    console.error('Failed to get metrics history:', error);
    return [];
  }
}

