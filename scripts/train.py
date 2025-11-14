"""
Training script for Logistic Regression model
Fetches data on-demand from CoinGecko (no local storage)
Exports weights to public/weights-lr.json
"""

import json
import requests
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import time

# CoinGecko API (free, no auth required)
COINGECKO_API = "https://api.coingecko.com/api/v3"

def fetch_ohlcv(coin_id="bitcoin", days=1, max_retries=3):
    """
    Fetch OHLCV data from CoinGecko with retry logic for rate limits
    Returns: list of [timestamp, open, high, low, close, volume]
    
    Note: CoinGecko OHLC endpoint only accepts specific days values:
    1, 7, 14, 30, 90, 180, 365, or "max"
    
    Candle intervals:
    - days=1: 5-minute candles (~288 candles)
    - days=7: 5-minute candles (~2016 candles)
    - days=14: 5-minute candles (~4032 candles)
    - days=30+: Daily candles (fewer data points)
    """
    # Validate days parameter
    valid_days = [1, 7, 14, 30, 90, 180, 365, "max"]
    original_days = days
    if days not in valid_days:
        # Round to nearest valid value
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
            print(f"Warning: Adjusted days parameter from {original_days} to {days} (CoinGecko API requirement)")
    
    # Warn about daily candles for longer periods
    if days >= 30:
        print(f"Note: {days} days will return daily candles (not 5-minute). For more data, use days=7 or days=14.")
    
    url = f"{COINGECKO_API}/coins/{coin_id}/ohlc"
    params = {"vs_currency": "usd", "days": days}
    
    # Retry logic for rate limits
    for attempt in range(max_retries):
        print(f"Fetching {days} days of {coin_id} data from CoinGecko... (attempt {attempt + 1}/{max_retries})")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Fetched {len(data)} candles")
            return data
        elif response.status_code == 429:
            # Rate limit - wait and retry
            wait_time = (2 ** attempt) * 5  # Exponential backoff: 5s, 10s, 20s
            if attempt < max_retries - 1:
                print(f"⚠️  Rate limit hit (429). Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                error_msg = "Rate limit exceeded. Please wait a few minutes and try again, or use a CoinGecko API key."
                raise Exception(error_msg)
        else:
            error_msg = f"API error: {response.status_code}"
            try:
                error_data = response.json()
                if "error" in error_data:
                    error_msg += f" - {error_data['error']}"
            except:
                error_msg += f" - {response.text[:200]}"
            raise Exception(error_msg)
    
    raise Exception("Failed to fetch data after retries")

def calculate_returns(prices, window):
    """Calculate returns over a window"""
    if len(prices) < window + 1:
        return np.zeros(len(prices))
    returns = np.diff(prices) / prices[:-1]
    # Pad with zeros
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

def create_features(ohlcv_data):
    """
    Create feature matrix from OHLCV data
    Features: [r5, r15, r30, vol30, rsi14, macd]
    """
    # Extract close prices
    closes = np.array([candle[4] for candle in ohlcv_data])
    
    # Calculate features
    r5 = calculate_returns(closes, 5)  # Approximate 5-period return
    r15 = calculate_returns(closes, 15)
    r30 = calculate_returns(closes, 30)
    vol30 = calculate_volatility(closes, 30)
    rsi14 = calculate_rsi(closes, 14)
    macd = calculate_macd(closes)
    
    # Stack features
    features = np.column_stack([r5, r15, r30, vol30, rsi14, macd])
    
    return features, closes

def create_labels(closes, k=20):
    """
    Create labels: 1 if price goes up in next k periods, 0 otherwise
    """
    labels = np.zeros(len(closes))
    
    for i in range(len(closes) - k):
        current_price = closes[i]
        future_price = closes[i + k]
        labels[i] = 1 if future_price > current_price else 0
    
    # Set last k to 0 (no future data)
    labels[-k:] = 0
    
    return labels

def train_model(days=1):
    """
    Main training function
    
    Args:
        days: Number of days to fetch (will be adjusted to valid CoinGecko values: 1, 7, 14, 30, 90, 180, 365)
    """
    print("=" * 60)
    print("Crypto Micro-Terminal - Model Training")
    print("=" * 60)
    
    # Fetch data (on-demand, no storage)
    # Note: days=1 gives ~288 candles (5-min intervals), days=7 gives ~2016 candles
    ohlcv = fetch_ohlcv("bitcoin", days=days)
    
    # Create features and labels
    print("\nCreating features...")
    X, closes = create_features(ohlcv)
    y = create_labels(closes, k=20)  # Predict next 20 periods (approx 100 minutes)
    
    # Remove rows with NaN or invalid data
    valid_mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
    X = X[valid_mask]
    y = y[valid_mask]
    
    print(f"Valid samples: {len(X)}")
    print(f"Positive labels: {np.sum(y)} ({np.mean(y)*100:.1f}%)")
    
    # Minimum samples requirement (lowered for flexibility)
    min_samples = 50
    if len(X) < min_samples:
        raise Exception(
            f"Not enough data for training. Got {len(X)} samples, need at least {min_samples}.\n"
            f"💡 Tip: Use days=7 or days=14 for more 5-minute candles (e.g., 'python train.py 7')"
        )
    
    # Standardize features
    print("\nStandardizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Logistic Regression
    print("\nTraining Logistic Regression...")
    lr = LogisticRegression(
        max_iter=500,
        C=1.0,
        random_state=42,
        solver='lbfgs'
    )
    lr.fit(X_scaled, y)
    
    # Calculate accuracy
    train_acc = lr.score(X_scaled, y)
    print(f"Training accuracy: {train_acc:.3f}")
    
    # Export weights
    weights = {
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist(),
        "coeffs": lr.coef_[0].tolist(),
        "bias": float(lr.intercept_[0])
    }
    
    output_path = "public/weights-lr.json"
    with open(output_path, 'w') as f:
        json.dump(weights, f, indent=2)
    
    print(f"\n✅ Model weights exported to {output_path}")
    print("\nWeights summary:")
    print(f"  Mean: {[f'{m:.4f}' for m in weights['mean']]}")
    print(f"  Std:  {[f'{s:.4f}' for s in weights['std']]}")
    print(f"  Coeffs: {[f'{c:.4f}' for c in weights['coeffs']]}")
    print(f"  Bias: {weights['bias']:.4f}")
    
    return weights

if __name__ == "__main__":
    import sys
    
    # Allow days parameter from command line: python train.py 7
    days = 1
    if len(sys.argv) > 1:
        try:
            days = int(sys.argv[1])
        except ValueError:
            print(f"Warning: Invalid days parameter '{sys.argv[1]}', using default: 1")
            days = 1
    
    print("\n💡 Recommended: Use days=7 or days=14 for best results (more 5-minute candles)")
    print("   Example: python train.py 7\n")
    
    try:
        train_model(days=days)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   - Rate limit (429): Wait a few minutes and try again")
        print("   - Not enough data: Try 'python train.py 7' or 'python train.py 14'")
        print("   - API errors: Check your internet connection")
        import traceback
        traceback.print_exc()
        exit(1)

