# Crypto Micro-Terminal 🚀

A **real-time crypto micro-terminal** that streams BTC/ETH ticks, computes lightweight indicators, and **predicts next-minute up/down** with a tiny logistic regression model. All deployed on **Vercel Edge** with **KV telemetry**. Zero local storage required.

## ✨ Features

- **Real-time streaming**: Server-Sent Events (SSE) for live price updates
- **Edge inference**: Sub-150ms prediction latency on Vercel Edge
- **Cloud-first**: No data downloads, all data fetched on-demand
- **Telemetry**: Live metrics (accuracy, latency, PnL) stored in Vercel KV
- **Role-flexible**: Adaptable for DS/DA/ML/BA presentations

## 🏗️ Architecture

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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (for local training, optional)
- Vercel account (free tier works)
- Kaggle account (for GPU training, recommended)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Vercel KV credentials:
   ```env
   KV_REST_API_URL=your_kv_url
   KV_REST_API_TOKEN=your_kv_token
   ```

3. **Train the model** (recommended: use Kaggle GPU):
   
   **Option A: Kaggle GPU Training (Recommended)**
   - See [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) for detailed instructions
   - Train on large datasets with free GPU
   - Download model files and place in `public/` folder
   
   **Option B: Local Training (CPU)**
   ```bash
   python scripts/train_nn.py 7
   ```
   
   This trains a neural network locally (slower, but works).

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

## 📊 Data Strategy (Zero Downloads)

- **Real-time**: CoinGecko API (free, 10-50 calls/min)
- **Training**: Fetches 48h OHLCV on-demand (~300KB, processed then discarded)
- **Storage**: Only model weights (~5KB JSON) and aggregated metrics in Vercel KV (<5MB)

## 🎯 Model

- **Algorithm**: Logistic Regression
- **Features**: Returns (5s, 15s, 30s), volatility, RSI(14), MACD
- **Target**: Next-k return > 0 (binary classification)
- **Inference**: Pure TypeScript on Edge (<150ms)

## 📈 API Endpoints

- `GET /api/stream` - SSE stream of real-time ticks + indicators
- `POST /api/predict` - Model inference endpoint
- `GET /api/metrics` - Current telemetry and performance metrics

## 🎨 Role Adaptation

The same codebase can be presented for different roles:

- **Data Scientist**: Feature importance, model diagnostics, ROC curves
- **Data Analyst**: Business KPIs, trends, correlation analysis
- **ML Engineer**: Model versioning, latency monitoring, A/B testing
- **Business Analyst**: ROI calculator, risk metrics, executive dashboard

Toggle views via query parameter: `?role=ds|da|ml|ba`

## 📝 Project Structure

```
crypto-microterminal/
├── app/
│   ├── api/
│   │   ├── stream/route.ts    # SSE endpoint
│   │   ├── predict/route.ts   # Inference endpoint
│   │   └── metrics/route.ts   # Telemetry endpoint
│   ├── page.tsx               # Main dashboard
│   └── layout.tsx
├── lib/
│   ├── features.ts            # Indicator computation
│   ├── model.ts               # LR inference
│   └── kv.ts                  # Vercel KV helpers
├── scripts/
│   └── train.py               # Training script
├── public/
│   └── weights-lr.json        # Model weights
└── README.md
```

## 🔧 Configuration

### Vercel KV Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a KV database
3. Copy the connection strings to `.env.local`

### Model Training

The training script:
- Fetches 48h of BTC OHLCV data from CoinGecko
- Computes features (returns, volatility, RSI, MACD)
- Trains Logistic Regression with L2 regularization
- Exports weights to `public/weights-lr.json`

Run: `python scripts/train.py`

## 📊 Metrics

Tracked metrics (stored in Vercel KV):
- Prediction accuracy
- Precision/Recall
- Average latency
- Rolling PnL (naive strategy)
- System uptime

View at: `/api/metrics`

## 🚢 Deployment

1. **Push to GitHub**
2. **Connect to Vercel**:
   ```bash
   vercel
   ```
3. **Set environment variables** in Vercel dashboard
4. **Deploy**: `vercel --prod`

## 📚 Documentation

- [ROADMAP.md](./ROADMAP.md) - Detailed project roadmap
- [MINDMAP.md](./MINDMAP.md) - Visual architecture mindmap

## 🎓 Learning Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Logistic Regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)

## 📄 License

MIT

## 🙏 Acknowledgments

- CoinGecko for free crypto API
- Vercel for hosting and KV storage
- scikit-learn for model training

---

**Built for recruiters, built for production, built for learning.** 🚀

