"""
Training script for Neural Network model (TensorFlow.js compatible)
Fetches data on-demand from CoinGecko (no local storage)
Exports model to TensorFlow.js format for edge inference
"""

import json
import requests
import numpy as np
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import time
import os

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
except ImportError:
    print("❌ TensorFlow not installed. Installing...")
    os.system("pip install tensorflow")
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers

# CoinGecko API (free, no auth required)
COINGECKO_API = "https://api.coingecko.com/api/v3"

def fetch_ohlcv(coin_id="bitcoin", days=7, max_retries=3):
    """Fetch OHLCV data from CoinGecko with retry logic"""
    valid_days = [1, 7, 14, 30, 90, 180, 365, "max"]
    original_days = days
    if days not in valid_days:
        if days < 1:
            days = 1
        elif days <= 7:
            days = 7
        elif days <= 14:
            days = 14
        elif days <= 30:
            days = 30
        elif days <= 90:
            days = 90
        elif days <= 180:
            days = 180
        else:
            days = 365
        if original_days != days:
            print(f"Warning: Adjusted days parameter from {original_days} to {days}")
    
    url = f"{COINGECKO_API}/coins/{coin_id}/ohlc"
    params = {"vs_currency": "usd", "days": days}
    
    for attempt in range(max_retries):
        print(f"Fetching {days} days of {coin_id} data... (attempt {attempt + 1}/{max_retries})")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Fetched {len(data)} candles")
            return data
        elif response.status_code == 429:
            wait_time = (2 ** attempt) * 5
            if attempt < max_retries - 1:
                print(f"⚠️  Rate limit hit. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                raise Exception("Rate limit exceeded. Please wait and try again.")
        else:
            raise Exception(f"API error: {response.status_code}")
    
    raise Exception("Failed to fetch data after retries")

def calculate_returns(prices, window):
    """Calculate returns over a window"""
    if len(prices) < window + 1:
        return np.zeros(len(prices))
    returns = np.diff(prices) / prices[:-1]
    padded = np.concatenate([[0], returns])
    return padded

def calculate_volatility(prices, window):
    """Calculate rolling volatility"""
    returns = calculate_returns(prices, 1)
    volatility = np.zeros(len(prices))
    for i in range(window, len(prices)):
        window_returns = returns[i-window:i]
        volatility[i] = np.std(window_returns)
    return volatility

def calculate_rsi(prices, period=14):
    """Calculate RSI"""
    rsi = np.zeros(len(prices))
    for i in range(period, len(prices)):
        changes = np.diff(prices[i-period:i+1])
        gains = changes[changes > 0]
        losses = -changes[changes < 0]
        avg_gain = np.mean(gains) if len(gains) > 0 else 0
        avg_loss = np.mean(losses) if len(losses) > 0 else 0
        if avg_loss == 0:
            rsi[i] = 100
        else:
            rs = avg_gain / avg_loss
            rsi[i] = 100 - (100 / (1 + rs))
    return rsi

def calculate_ema(prices, span):
    """Calculate EMA"""
    alpha = 2 / (span + 1)
    ema = np.zeros(len(prices))
    ema[0] = prices[0]
    for i in range(1, len(prices)):
        ema[i] = alpha * prices[i] + (1 - alpha) * ema[i-1]
    return ema

def calculate_macd(prices):
    """Calculate MACD"""
    ema12 = calculate_ema(prices, 12)
    ema26 = calculate_ema(prices, 26)
    macd_line = ema12 - ema26
    signal_line = calculate_ema(macd_line, 9)
    return macd_line - signal_line

def calculate_bollinger_bands(prices, window=20, num_std=2):
    """Calculate Bollinger Bands"""
    sma = np.convolve(prices, np.ones(window)/window, mode='same')
    std = np.array([np.std(prices[max(0, i-window):i+1]) for i in range(len(prices))])
    upper = sma + (std * num_std)
    lower = sma - (std * num_std)
    return (upper - prices) / (upper - lower + 1e-8)  # Normalized position

def create_enhanced_features(ohlcv_data):
    """
    Create enhanced feature matrix with more meaningful features
    Features: [r5, r15, r30, r60, vol30, vol60, rsi14, macd, bb_position, price_momentum, volume_trend]
    """
    closes = np.array([candle[4] for candle in ohlcv_data])
    volumes = np.array([candle[5] for candle in ohlcv_data])
    
    # Returns
    r5 = calculate_returns(closes, 5)
    r15 = calculate_returns(closes, 15)
    r30 = calculate_returns(closes, 30)
    r60 = calculate_returns(closes, 60)
    
    # Volatility
    vol30 = calculate_volatility(closes, 30)
    vol60 = calculate_volatility(closes, 60)
    
    # Technical indicators
    rsi14 = calculate_rsi(closes, 14)
    macd = calculate_macd(closes)
    bb_position = calculate_bollinger_bands(closes, 20, 2)
    
    # Price momentum (rate of change)
    price_momentum = calculate_returns(closes, 10)
    
    # Volume trend (normalized)
    volume_ema = calculate_ema(volumes, 20)
    volume_trend = (volumes - volume_ema) / (volume_ema + 1e-8)
    
    # Stack features
    features = np.column_stack([
        r5, r15, r30, r60,
        vol30, vol60,
        rsi14 / 100.0,  # Normalize RSI to 0-1
        macd / closes,  # Normalize MACD by price
        bb_position,
        price_momentum,
        volume_trend
    ])
    
    return features, closes

def create_labels(closes, k=20):
    """Create labels: 1 if price goes up in next k periods, 0 otherwise"""
    labels = np.zeros(len(closes))
    for i in range(len(closes) - k):
        current_price = closes[i]
        future_price = closes[i + k]
        labels[i] = 1 if future_price > current_price else 0
    labels[-k:] = 0
    return labels

def train_neural_network(days=7):
    """Train a small neural network for edge inference"""
    print("=" * 60)
    print("Crypto Micro-Terminal - Neural Network Training")
    print("=" * 60)
    
    # Fetch data
    ohlcv = fetch_ohlcv("bitcoin", days=days)
    
    # Create features and labels
    print("\nCreating enhanced features...")
    X, closes = create_enhanced_features(ohlcv)
    y = create_labels(closes, k=20)
    
    # Remove rows with NaN
    valid_mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
    X = X[valid_mask]
    y = y[valid_mask]
    
    print(f"Valid samples: {len(X)}")
    print(f"Feature count: {X.shape[1]}")
    print(f"Positive labels: {np.sum(y)} ({np.mean(y)*100:.1f}%)")
    
    if len(X) < 100:
        raise Exception(f"Not enough data. Got {len(X)} samples, need at least 100.")
    
    # Standardize features
    print("\nStandardizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data (80/20)
    split_idx = int(len(X_scaled) * 0.8)
    X_train, X_val = X_scaled[:split_idx], X_scaled[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    # Build small neural network (lightweight for edge)
    print("\nBuilding neural network...")
    model = keras.Sequential([
        layers.Dense(32, activation='relu', input_shape=(X.shape[1],)),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(8, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', 'precision', 'recall']
    )
    
    # Train model
    print("\nTraining neural network...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=32,
        verbose=1
    )
    
    # Evaluate
    val_loss, val_acc, val_prec, val_rec = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n✅ Validation Results:")
    print(f"   Accuracy: {val_acc:.3f}")
    print(f"   Precision: {val_prec:.3f}")
    print(f"   Recall: {val_rec:.3f}")
    
    # Export scaler parameters
    scaler_params = {
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist(),
        "feature_count": X.shape[1]
    }
    
    # Save scaler
    with open('public/scaler-params.json', 'w') as f:
        json.dump(scaler_params, f, indent=2)
    
    # Convert to TensorFlow.js format
    print("\nConverting to TensorFlow.js format...")
    try:
        import tensorflowjs as tfjs
    except ImportError:
        print("Installing tensorflowjs...")
        os.system("pip install tensorflowjs")
        import tensorflowjs as tfjs
    
    # Save model
    model_dir = 'public/model'
    os.makedirs(model_dir, exist_ok=True)
    tfjs.converters.save_keras_model(model, model_dir)
    
    print(f"\n✅ Model exported to {model_dir}/")
    print(f"✅ Scaler parameters saved to public/scaler-params.json")
    print(f"\nModel architecture:")
    model.summary()
    
    return model, scaler

if __name__ == "__main__":
    import sys
    
    days = 7
    if len(sys.argv) > 1:
        try:
            days = int(sys.argv[1])
        except ValueError:
            print(f"Warning: Invalid days parameter, using default: 7")
            days = 7
    
    print("\n💡 Training neural network with enhanced features")
    print("   Recommended: days=7 or days=14 for best results\n")
    
    try:
        train_neural_network(days=days)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

