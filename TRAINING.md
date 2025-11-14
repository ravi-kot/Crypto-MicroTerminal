# Model Training Guide

## Neural Network Model (Recommended)

The project now uses a **small neural network** powered by TensorFlow.js for better predictions.

### Quick Start

1. **Install Python dependencies:**
   ```bash
   pip install tensorflow tensorflowjs scikit-learn numpy requests
   ```

2. **Train the neural network:**
   ```bash
   python scripts/train_nn.py 7
   ```
   
   This will:
   - Fetch 7 days of BTC data from CoinGecko
   - Create enhanced features (11 features)
   - Train a small neural network (32→16→8→1)
   - Export to TensorFlow.js format
   - Save scaler parameters

3. **Model files will be created:**
   - `public/model/` - TensorFlow.js model files
   - `public/scaler-params.json` - Feature scaling parameters

### Enhanced Features

The neural network uses **11 enhanced features**:
1. Returns: r5, r15, r30, r60 (short to medium-term returns)
2. Volatility: vol30, vol60 (rolling volatility)
3. Technical indicators: RSI(14), MACD
4. Bollinger Bands position (normalized)
5. Price momentum
6. Volume trend

### Model Architecture

- **Input**: 11 features
- **Hidden layers**: 32 → 16 → 8 neurons (ReLU activation)
- **Output**: 1 neuron (Sigmoid activation)
- **Dropout**: 0.2 (regularization)
- **Total parameters**: ~1,000 (lightweight for edge)

### Performance

Expected results:
- **Accuracy**: 55-65% (better than random 50%)
- **Inference time**: <50ms on Edge
- **Model size**: ~50KB (gzipped)

### Legacy Logistic Regression

If you prefer the simpler model:
```bash
python scripts/train.py 7
```

This creates `public/weights-lr.json` for the logistic regression model.

## Tips

- Use `days=7` or `days=14` for best results (more training data)
- The model automatically handles rate limits with retries
- Training takes 1-2 minutes on a modern CPU

