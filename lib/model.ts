/**
 * Model Inference Library
 * Pure TypeScript logistic regression inference
 */

interface ModelWeights {
  mean: number[];
  std: number[];
  coeffs: number[];
  bias: number;
}

// Default weights (will be replaced by actual trained model)
const DEFAULT_WEIGHTS: ModelWeights = {
  mean: [0, 0, 0, 0, 50, 0],
  std: [1, 1, 1, 1, 15, 1],
  coeffs: [0.1, 0.1, 0.1, 0.05, -0.01, 0.05],
  bias: 0.0,
};

let cachedWeights: ModelWeights | null = null;

/**
 * Load model weights (with caching)
 */
async function loadWeights(): Promise<ModelWeights> {
  if (cachedWeights) return cachedWeights;

  try {
    // Try to load from public folder
    const response = await fetch('/weights-lr.json', { cache: 'no-store' });
    if (response.ok) {
      cachedWeights = await response.json();
      return cachedWeights!;
    }
  } catch (error) {
    console.warn('Failed to load weights, using defaults:', error);
  }

  return DEFAULT_WEIGHTS;
}

/**
 * Sigmoid activation function
 */
function sigmoid(z: number): number {
  // Clamp to prevent overflow
  const clamped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clamped));
}

/**
 * Standardize a single feature value
 */
function standardize(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}

/**
 * Predict probability of upward movement
 * @param features Feature vector: [r5, r15, r30, vol30, rsi14, macd]
 * @returns Prediction with probability and label
 */
export async function predict(features: number[]): Promise<{
  prob: number;
  label: number;
}> {
  const weights = await loadWeights();

  // Validate feature length
  if (features.length !== weights.coeffs.length) {
    throw new Error(
      `Feature length mismatch: expected ${weights.coeffs.length}, got ${features.length}`
    );
  }

  // Standardize features and compute dot product
  let z = weights.bias;
  for (let i = 0; i < features.length; i++) {
    const standardized = standardize(
      features[i],
      weights.mean[i] || 0,
      weights.std[i] || 1
    );
    z += standardized * weights.coeffs[i];
  }

  // Apply sigmoid
  const prob = sigmoid(z);
  const label = prob > 0.5 ? 1 : 0;

  return { prob, label };
}

/**
 * Synchronous version (for Edge runtime where async fetch might be limited)
 * Requires weights to be passed in
 */
export function predictSync(features: number[], weights: ModelWeights): {
  prob: number;
  label: number;
} {
  if (features.length !== weights.coeffs.length) {
    throw new Error(
      `Feature length mismatch: expected ${weights.coeffs.length}, got ${features.length}`
    );
  }

  let z = weights.bias;
  for (let i = 0; i < features.length; i++) {
    const standardized = standardize(
      features[i],
      weights.mean[i] || 0,
      weights.std[i] || 1
    );
    z += standardized * weights.coeffs[i];
  }

  const prob = sigmoid(z);
  const label = prob > 0.5 ? 1 : 0;

  return { prob, label };
}

