/**
 * Neural Network Model Inference Library
 * Uses TensorFlow.js for edge inference
 */

import * as tf from '@tensorflow/tfjs';

interface ScalerParams {
  mean: number[];
  std: number[];
  feature_count: number;
}

let model: tf.LayersModel | null = null;
let scalerParams: ScalerParams | null = null;
let modelLoading = false;

/**
 * Load TensorFlow.js model (with caching)
 */
async function loadModel(): Promise<tf.LayersModel> {
  if (model) return model;
  if (modelLoading) {
    // Wait for ongoing load
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (model) return model;
  }

  modelLoading = true;
  try {
    // Load model from public folder
    model = await tf.loadLayersModel('/model/model.json');
    console.log('✅ Neural network model loaded');
  } catch (error) {
    console.warn('Failed to load TensorFlow.js model, using fallback:', error);
    // Fallback: create a simple model (for development)
    model = createFallbackModel();
  } finally {
    modelLoading = false;
  }

  return model!;
}

/**
 * Create a simple fallback model if TensorFlow.js model fails to load
 */
function createFallbackModel(): tf.LayersModel {
  const fallback = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [11], units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 8, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' }),
    ],
  });
  return fallback;
}

/**
 * Load scaler parameters
 */
async function loadScaler(): Promise<ScalerParams> {
  if (scalerParams) return scalerParams;

  try {
    const response = await fetch('/scaler-params.json', { cache: 'no-store' });
    if (response.ok) {
      scalerParams = await response.json();
      return scalerParams!;
    }
  } catch (error) {
    console.warn('Failed to load scaler params:', error);
  }

  // Fallback: return default scaler
  return {
    mean: new Array(11).fill(0),
    std: new Array(11).fill(1),
    feature_count: 11,
  };
}

/**
 * Standardize features
 */
function standardizeFeatures(features: number[], scaler: ScalerParams): number[] {
  return features.map((val, idx) => {
    const mean = scaler.mean[idx] || 0;
    const std = scaler.std[idx] || 1;
    return std === 0 ? 0 : (val - mean) / std;
  });
}

/**
 * Predict probability of upward movement using neural network
 * @param features Enhanced feature vector: [r5, r15, r30, r60, vol30, vol60, rsi14, macd, bb_position, price_momentum, volume_trend]
 * @returns Prediction with probability and label
 */
export async function predict(features: number[]): Promise<{
  prob: number;
  label: number;
}> {
  try {
    // Load model and scaler
    const [tfModel, scaler] = await Promise.all([loadModel(), loadScaler()]);

    // Validate feature length
    if (features.length !== scaler.feature_count) {
      console.warn(
        `Feature length mismatch: expected ${scaler.feature_count}, got ${features.length}. Padding/truncating.`
      );
      // Pad or truncate features
      if (features.length < scaler.feature_count) {
        features = [...features, ...new Array(scaler.feature_count - features.length).fill(0)];
      } else {
        features = features.slice(0, scaler.feature_count);
      }
    }

    // Standardize features
    const standardized = standardizeFeatures(features, scaler);

    // Convert to tensor
    const input = tf.tensor2d([standardized]);

    // Predict
    const prediction = tfModel.predict(input) as tf.Tensor;
    const prob = (await prediction.data())[0];
    
    // Cleanup
    input.dispose();
    prediction.dispose();

    const label = prob > 0.5 ? 1 : 0;

    return { prob, label };
  } catch (error) {
    console.error('Prediction error:', error);
    // Fallback: return neutral prediction
    return { prob: 0.5, label: 0 };
  }
}

/**
 * Check if model is loaded
 */
export async function isModelReady(): Promise<boolean> {
  try {
    await loadModel();
    return model !== null;
  } catch {
    return false;
  }
}
