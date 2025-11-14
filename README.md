# Crypto Micro-Terminal

A real-time cryptocurrency prediction system that streams live BTC/ETH price data, computes technical indicators, and predicts next-minute price direction using machine learning. Deployed on Vercel Edge with sub-150ms inference latency and zero local storage requirements.

![Dashboard Screenshot](https://github.com/user-attachments/assets/1e8bffc5-b89c-4b45-b6a9-f82100bc0292)

## What This Is

I built this project to demonstrate a complete end-to-end ML system for real-time financial predictions. It's a full-stack application that combines real-time data streaming, feature engineering, machine learning inference, and a modern web interface - all running on edge infrastructure.

The system streams live crypto prices, computes technical indicators in real-time, and uses a neural network to predict whether the price will go up or down in the next minute. Everything runs on Vercel Edge Functions for low latency, and I designed it to work without any local data storage.

## Key Features

**Real-Time Data Processing**
- Live price streaming from CoinGecko API using Server-Sent Events
- Real-time computation of technical indicators (RSI, MACD, Bollinger Bands, volatility)
- Updates every 3 seconds with minimal latency

**Machine Learning**
- Neural network model running on TensorFlow.js in the browser/edge
- 11 engineered features including returns, volatility, and momentum indicators
- Model trained on GPU using Kaggle (free tier)
- Sub-150ms inference latency on Vercel Edge

**Architecture**
- Edge functions for global deployment
- Optional KV storage for telemetry (works without it)
- Zero-download approach - all data fetched on-demand
- Serverless and scalable

**Tech Stack**
- Next.js 14 with App Router
- TypeScript throughout
- Tailwind CSS for styling
- Recharts for visualizations
- TensorFlow.js for ML inference

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  CoinGecko  │────▶│  Edge SSE    │────▶│   Client    │
│     API     │     │   Stream     │     │   (React)   │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Indicators  │     │  Prediction │
                    │  (Features)  │     │   (Edge)    │
                    └──────────────┘     └─────────────┘
                            │                     │
                            └─────────┬───────────┘
                                      ▼
                              ┌──────────────┐
                              │  Vercel KV   │
                              │ (Telemetry)  │
                              └──────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+ (only if you want to train locally)
- Vercel account (free tier works fine)
- Kaggle account (recommended for GPU training)

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/ravi-kot/Crypto-MicroTerminal.git
   cd Crypto-MicroTerminal
   npm install
   ```

2. Environment variables (optional - the app works without storage):
   ```bash
   cp .env.example .env.local
   ```
   
   If you want telemetry, add your Vercel KV credentials:
   ```env
   KV_REST_API_URL=your_kv_url
   KV_REST_API_TOKEN=your_kv_token
   ```

3. Train the model:

   I recommend using Kaggle for GPU training - it's free and much faster. See [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) for the full setup.

   If you want to train locally:
   ```bash
   python scripts/train_nn.py 7
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

5. Deploy to Vercel:
   - Push to GitHub
   - Import project in Vercel dashboard
   - Click deploy (that's it - no env vars needed for basic functionality)

## How It Works

**Data Flow**
- Fetches real-time prices from CoinGecko API every 3 seconds
- Computes technical indicators on the fly (no pre-processing needed)
- Sends features to the neural network for prediction
- Displays results in real-time on the dashboard

**Model**
- Neural network with 11 input features
- Architecture: 32 → 16 → 8 → 1 neurons
- Trained on 7-365 days of historical BTC data
- Exported to TensorFlow.js for edge deployment
- Accuracy: 55-65% (better than random, which is the goal for crypto)

**Features Used**
1. Returns over 5s, 15s, 30s, 60s windows
2. Rolling volatility (30s and 60s)
3. RSI(14) - momentum indicator
4. MACD - trend indicator
5. Bollinger Bands position
6. Price momentum
7. Volume trends

## API Endpoints

- `GET /api/stream` - SSE stream of live prices and indicators
- `POST /api/predict` - Model inference (takes features, returns probability)
- `GET /api/metrics` - System metrics (accuracy, latency, etc.)
- `GET /api/history?hours=24` - Historical price data for charts

## Project Structure

```
crypto-microterminal/
├── app/
│   ├── api/              # Edge function endpoints
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx
├── lib/
│   ├── features.ts       # Indicator calculations
│   ├── model.ts          # TensorFlow.js inference
│   └── kv.ts             # Storage helpers (optional)
├── scripts/
│   ├── train.py          # Simple LR training
│   └── train_nn.py       # Neural network training
├── kaggle/
│   └── train_model.py    # GPU training script
└── public/
    └── model/            # TensorFlow.js model files
```

## Training the Model

I trained the model on Kaggle using their free GPU. The script fetches historical data from CoinGecko, computes features, and trains a neural network. Then it exports everything to TensorFlow.js format so it can run on the edge.

**Kaggle Training (Recommended)**
- Free GPU access (T4 x2)
- Much faster than CPU training
- See [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) for details

**Local Training**
```bash
pip install tensorflow tensorflowjs scikit-learn numpy requests
python scripts/train_nn.py 7
```

The model files will be created in `public/` and automatically used by the app.

## Deployment

I deployed this on Vercel - it's super simple:

1. Push code to GitHub
2. Import project in Vercel
3. Deploy (no configuration needed)

The app works without any environment variables. Storage is optional - I added it for telemetry, but the core functionality (predictions, streaming, charts) works perfectly without it.

See [DEPLOYMENT_NO_STORAGE.md](./DEPLOYMENT_NO_STORAGE.md) for the quick deployment guide.

## Design Decisions

**Why Edge Functions?**
- Low latency (predictions in <150ms)
- Global deployment
- No cold starts with this model size
- Free tier is generous

**Why TensorFlow.js?**
- Runs in browser and edge runtime
- No server-side GPU needed for inference
- Model is small enough (~200KB) to load quickly
- Works seamlessly with Next.js

**Why No Local Storage?**
- I wanted to demonstrate cloud-first architecture
- No need to download GBs of historical data
- Always uses fresh, real-time data
- Easier to deploy and share

**Why Neural Network over Logistic Regression?**
- Better accuracy (55-65% vs ~50%)
- More impressive for portfolio
- Still fast enough for edge deployment
- Shows ML engineering skills

## Performance

- Inference latency: <50ms on edge
- End-to-end prediction: <150ms
- Model size: ~200KB (gzipped)
- Memory usage: <100MB per function
- Real-time updates: Every 3 seconds

## What I Learned

Building this project taught me a lot about:
- Edge computing and serverless architecture
- Real-time data streaming with SSE
- Deploying ML models to production
- Optimizing for low latency
- Cloud-first design patterns

## Future Improvements

If I were to continue this project, I'd add:
- Multi-asset support (ETH, SOL, etc.)
- Sentiment analysis from social media
- More sophisticated models (LSTM, transformers)
- Automated model retraining
- WebSocket for even lower latency

## Documentation

- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Full deployment guide
- [DEPLOYMENT_NO_STORAGE.md](./DEPLOYMENT_NO_STORAGE.md) - Quick deployment
- [TRAINING.md](./TRAINING.md) - Model training guide
- [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) - Kaggle GPU setup

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Recharts

**Backend**
- Vercel Edge Functions
- Server-Sent Events
- TensorFlow.js

**ML**
- Python + TensorFlow/Keras (training)
- TensorFlow.js (inference)
- Scikit-learn (preprocessing)

**Data**
- CoinGecko API

## License

MIT

## Acknowledgments

Thanks to CoinGecko for the free API, Vercel for the hosting platform, and Kaggle for free GPU compute. This project wouldn't be possible without these tools.

---

This project demonstrates my ability to build end-to-end ML systems, work with modern web technologies, and deploy production-ready applications. Feel free to check out the code and let me know if you have any questions!
