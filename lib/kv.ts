/**
 * Vercel KV (Upstash) Helper Functions
 * Telemetry and metrics storage
 * Storage is optional - app works without it
 */

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
 * Log a prediction to KV (optional - works without storage)
 */
export async function logPrediction(log: PredictionLog): Promise<void> {
  // Check if KV is available
  let kvInstance: any = null;
  try {
    const { kv } = await import('@vercel/kv');
    kvInstance = kv;
  } catch {
    // KV not available - silently skip
    return;
  }
  
  try {
    // Add to predictions list (keep last N)
    const key = `${PREDICTIONS_KEY}:${Date.now()}`;
    await kvInstance.set(key, log, { ex: 86400 }); // Expire after 24h

    // Also maintain a sorted set for quick access
    await kvInstance.zadd(PREDICTIONS_KEY, Date.now(), JSON.stringify(log));

    // Trim old predictions
    const count = await kvInstance.zcard(PREDICTIONS_KEY);
    if (count > MAX_PREDICTIONS) {
      const toRemove = count - MAX_PREDICTIONS;
      await kvInstance.zremrangebyrank(PREDICTIONS_KEY, 0, toRemove - 1);
    }
  } catch (error) {
    // Don't throw - telemetry failures shouldn't break the app
    // Silently fail if storage is not configured
  }
}

/**
 * Get recent predictions (returns empty if storage not available)
 */
export async function getRecentPredictions(limit: number = 100): Promise<PredictionLog[]> {
  let kvInstance: any = null;
  try {
    const { kv } = await import('@vercel/kv');
    kvInstance = kv;
  } catch {
    return [];
  }
  
  try {
    const results = await kvInstance.zrange(PREDICTIONS_KEY, -limit, -1, {
      rev: true,
    });
    return results.map((r) => JSON.parse(r as string)) as PredictionLog[];
  } catch (error) {
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
 * Store aggregated metrics (optional - works without storage)
 */
export async function storeMetrics(metrics: Metrics): Promise<void> {
  let kvInstance: any = null;
  try {
    const { kv } = await import('@vercel/kv');
    kvInstance = kv;
  } catch {
    return;
  }
  
  try {
    const key = `${METRICS_KEY}:${Date.now()}`;
    await kvInstance.set(key, metrics, { ex: 604800 }); // Expire after 7 days
  } catch (error) {
    // Silently fail if storage not available
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

