# Model Training Guide

How to train the neural network model for this project.

## Neural Network Model

I'm using a small neural network powered by TensorFlow.js. It's lightweight enough to run on the edge but still gives better predictions than a simple logistic regression.

## Quick Start

### Option 1: Kaggle GPU Training (Recommended)

I trained my model on Kaggle because:
- Free GPU access (T4 x2)
- Much faster than CPU training
- Can train on larger datasets

**Steps:**

1. Install Python dependencies:
   ```bash
   pip install tensorflow tensorflowjs scikit-learn numpy requests
   ```

2. Go to [Kaggle.com](https://www.kaggle.com) and create a new notebook

3. Enable GPU: Settings → Accelerator → GPU T4 x2

4. Copy the code from `kaggle/train_model.py` into your notebook

5. Run the training (takes 5-15 minutes on GPU)

6. Download the model files:
   - `model/` folder
   - `scaler-params.json`

7. Place them in your project's `public/` folder

See [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) for detailed instructions.

### Option 2: Local Training (CPU)

If you don't want to use Kaggle, you can train locally:

```bash
# Install dependencies
pip install tensorflow tensorflowjs scikit-learn numpy requests

# Train the model
python scripts/train_nn.py 7
```

This will:
- Fetch 7 days of BTC data from CoinGecko
- Create 11 features
- Train a neural network
- Export to TensorFlow.js format
- Save files to `public/`

**Note**: CPU training takes longer (30-60 minutes vs 5-15 on GPU).

## Model Architecture

I chose a small architecture to keep inference fast on the edge:

- Input: 11 features
- Hidden layers: 32 → 16 → 8 neurons
- Output: 1 neuron (sigmoid for probability)
- Dropout: 0.2-0.3 (to prevent overfitting)
- Total parameters: ~1,000 (very lightweight)

## Features

The model uses 11 features:

1. Returns: r5, r15, r30, r60 (short to medium-term returns)
2. Volatility: vol30, vol60 (rolling volatility)
3. Technical indicators: RSI(14), MACD
4. Bollinger Bands position (normalized)
5. Price momentum
6. Volume trend

I chose these because they're:
- Computable in real-time
- Meaningful for price prediction
- Not too correlated with each other

## Performance

What to expect:

- **Accuracy**: 55-65% (better than random 50%)
- **Inference time**: <50ms on Edge
- **Model size**: ~200KB (gzipped)
- **Training time**: 5-15 min on GPU, 30-60 min on CPU

## Tips

- Use `days=7` or `days=14` for best results (more training data)
- The script handles rate limits automatically with retries
- Training takes longer on CPU but works fine
- Model files are automatically used by the app once in `public/`

## Troubleshooting

**Out of memory?**
- Reduce batch size in the training script
- Use less data (7 days instead of 14)

**Rate limit errors?**
- The script has retry logic built in
- Wait a few minutes and try again
- Or get a free CoinGecko API key

**Model too large?**
- The architecture is already optimized for edge
- If needed, reduce hidden layer sizes in the script

## Legacy Logistic Regression

If you prefer the simpler model, you can use:

```bash
python scripts/train.py 7
```

This creates `public/weights-lr.json` for logistic regression. The app will use whichever model files are available.
