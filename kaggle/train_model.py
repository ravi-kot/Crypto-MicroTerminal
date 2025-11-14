"""
Kaggle Notebook: Train Neural Network on Large Crypto Dataset
Run this on Kaggle with GPU enabled for faster training

Dataset: Use any crypto dataset from Kaggle (e.g., "Cryptocurrency Historical Prices")
Or use CoinGecko API to fetch large historical dataset
"""

import numpy as np
import pandas as pd
import json
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs
import os

print("TensorFlow version:", tf.__version__)
print("GPU Available:", tf.config.list_physical_devices('GPU'))

# ============================================================================
# DATA LOADING
# ============================================================================

def load_kaggle_crypto_data(file_path='../input/cryptocurrency-historical-prices/bitcoin.csv'):
    """
    Load crypto data from Kaggle dataset
    Adjust file path based on your dataset
    """
    try:
        df = pd.read_csv(file_path)
        # Standardize column names
        df.columns = df.columns.str.lower()
        
        # Ensure we have required columns
        if 'close' in df.columns:
            prices = df['close'].values
        elif 'price' in df.columns:
            prices = df['price'].values
        else:
            raise ValueError("No price column found")
            
        print(f"✅ Loaded {len(prices)} data points")
        return prices, df
    except Exception as e:
        print(f"⚠️  Could not load Kaggle dataset: {e}")
        print("Falling back to CoinGecko API...")
        return None, None

def fetch_coingecko_data(days=365):
    """Fetch large dataset from CoinGecko API"""
    import requests
    
    url = f"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart"
    params = {"vs_currency": "usd", "days": days, "interval": "daily"}
    
    response = requests.get(url, params=params, timeout=60)
    if response.status_code == 200:
        data = response.json()
        prices = [point[1] for point in data['prices']]
        print(f"✅ Fetched {len(prices)} days of data from CoinGecko")
        return np.array(prices)
    else:
        raise Exception(f"API error: {response.status_code}")

# ============================================================================
# FEATURE ENGINEERING
# ============================================================================

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
    """Calculate Bollinger Bands position"""
    sma = np.convolve(prices, np.ones(window)/window, mode='same')
    std = np.array([np.std(prices[max(0, i-window):i+1]) for i in range(len(prices))])
    upper = sma + (std * num_std)
    lower = sma - (std * num_std)
    return (upper - prices) / (upper - lower + 1e-8)

def create_enhanced_features(prices, volumes=None):
    """
    Create enhanced feature matrix
    Features: [r5, r15, r30, r60, vol30, vol60, rsi14, macd, bb_position, price_momentum, volume_trend]
    """
    # Returns
    r5 = calculate_returns(prices, 5)
    r15 = calculate_returns(prices, 15)
    r30 = calculate_returns(prices, 30)
    r60 = calculate_returns(prices, 60)
    
    # Volatility
    vol30 = calculate_volatility(prices, 30)
    vol60 = calculate_volatility(prices, 60)
    
    # Technical indicators
    rsi14 = calculate_rsi(prices, 14)
    macd = calculate_macd(prices)
    bb_position = calculate_bollinger_bands(prices, 20, 2)
    
    # Price momentum
    price_momentum = calculate_returns(prices, 10)
    
    # Volume trend (if available)
    if volumes is not None and len(volumes) == len(prices):
        volume_ema = calculate_ema(volumes, 20)
        volume_trend = (volumes - volume_ema) / (volume_ema + 1e-8)
    else:
        volume_trend = np.zeros(len(prices))
    
    # Stack features
    features = np.column_stack([
        r5, r15, r30, r60,
        vol30, vol60,
        rsi14 / 100.0,  # Normalize RSI to 0-1
        macd / prices,  # Normalize MACD by price
        bb_position,
        price_momentum,
        volume_trend
    ])
    
    return features

def create_labels(prices, k=20):
    """Create labels: 1 if price goes up in next k periods, 0 otherwise"""
    labels = np.zeros(len(prices))
    for i in range(len(prices) - k):
        current_price = prices[i]
        future_price = prices[i + k]
        labels[i] = 1 if future_price > current_price else 0
    labels[-k:] = 0
    return labels

# ============================================================================
# MODEL TRAINING
# ============================================================================

def build_model(input_dim):
    """Build neural network model"""
    model = keras.Sequential([
        layers.Dense(64, activation='relu', input_shape=(input_dim,)),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(16, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(8, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', 'precision', 'recall', 'auc']
    )
    
    return model

def train_model():
    """Main training function"""
    print("=" * 70)
    print("CRYPTO PREDICTION MODEL - KAGGLE GPU TRAINING")
    print("=" * 70)
    
    # Load data
    print("\n📊 Loading data...")
    prices, df = load_kaggle_crypto_data()
    
    if prices is None:
        # Fallback to CoinGecko
        prices = fetch_coingecko_data(days=365)
        volumes = None
    else:
        # Try to get volumes from dataset
        if df is not None and 'volume' in df.columns:
            volumes = df['volume'].values
        else:
            volumes = None
    
    print(f"Data points: {len(prices)}")
    
    # Create features and labels
    print("\n🔧 Creating features...")
    X = create_enhanced_features(prices, volumes)
    y = create_labels(prices, k=20)
    
    # Remove NaN rows
    valid_mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
    X = X[valid_mask]
    y = y[valid_mask]
    
    print(f"✅ Valid samples: {len(X)}")
    print(f"✅ Features: {X.shape[1]}")
    print(f"✅ Positive labels: {np.sum(y)} ({np.mean(y)*100:.1f}%)")
    
    if len(X) < 1000:
        raise Exception(f"Not enough data. Got {len(X)} samples, need at least 1000.")
    
    # Standardize features
    print("\n📏 Standardizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Build model
    print("\n🧠 Building neural network...")
    model = build_model(X.shape[1])
    model.summary()
    
    # Train model
    print("\n🚀 Training model (GPU accelerated)...")
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6
        )
    ]
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=100,
        batch_size=256,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\n📈 Evaluating model...")
    test_loss, test_acc, test_prec, test_rec, test_auc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n✅ Test Results:")
    print(f"   Accuracy: {test_acc:.4f}")
    print(f"   Precision: {test_prec:.4f}")
    print(f"   Recall: {test_rec:.4f}")
    print(f"   AUC: {test_auc:.4f}")
    
    # Export scaler
    print("\n💾 Exporting scaler parameters...")
    scaler_params = {
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist(),
        "feature_count": X.shape[1]
    }
    
    with open('scaler-params.json', 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print("✅ Saved scaler-params.json")
    
    # Export model to TensorFlow.js
    print("\n💾 Exporting model to TensorFlow.js format...")
    model_dir = 'model'
    os.makedirs(model_dir, exist_ok=True)
    tfjs.converters.save_keras_model(model, model_dir)
    print(f"✅ Model exported to {model_dir}/")
    
    # Also save as Keras format (backup)
    model.save('model_keras.h5')
    print("✅ Model saved as model_keras.h5 (backup)")
    
    # Save training history
    with open('training_history.json', 'w') as f:
        json.dump({k: [float(v) for v in vals] for k, vals in history.history.items()}, f, indent=2)
    print("✅ Training history saved")
    
    print("\n" + "=" * 70)
    print("✅ TRAINING COMPLETE!")
    print("=" * 70)
    print("\n📦 Files created:")
    print("   - model/ (TensorFlow.js model)")
    print("   - scaler-params.json")
    print("   - model_keras.h5 (backup)")
    print("   - training_history.json")
    print("\n📥 Download these files and place in your project's public/ folder")
    
    return model, scaler

# Run training
if __name__ == "__main__":
    model, scaler = train_model()

