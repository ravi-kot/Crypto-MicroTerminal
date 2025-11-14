# Development Roadmap

How I planned and built this project, phase by phase.

## Project Philosophy

I designed this project to be:
- Zero-download: All data fetched on-demand from free APIs
- Role-adaptable: Same codebase, different presentations (DS/DA/ML/BA)
- Production-ready: Deployable on Vercel Free tier
- Recruiter-friendly: Live demo, clean metrics, clear value prop

## Architecture Overview

```
Crypto Micro-Terminal
│
├── Data Layer (Cloud APIs - No Downloads)
│   ├── Real-time: CoinGecko API (free, no auth)
│   ├── Historical: CoinGecko OHLCV (on-demand, small windows)
│   ├── Alternative: Binance WebSocket (if rate limits hit)
│   └── Storage: Vercel KV (only aggregated metrics, <1MB)
│
├── Feature Engineering (Pure TypeScript)
│   ├── Returns: r_5s, r_15s, r_30s, r_60s
│   ├── Volatility: rolling std (30s, 60s)
│   ├── Momentum: EMA(12,26), MACD, RSI(14)
│   ├── Microstructure: tick direction, spread proxy
│   └── Time features: hour, day-of-week (for BA angle)
│
├── Model Layer (Edge Inference)
│   ├── Training: Python script (fetches 24-48h on-demand)
│   ├── Model: Neural Network (TensorFlow.js)
│   ├── Inference: Edge runtime (<150ms)
│   └── Versioning: model files in public/
│
├── API Layer (Vercel Edge Functions)
│   ├── /api/stream (SSE): Real-time ticks + indicators
│   ├── /api/predict (POST): Model inference
│   ├── /api/metrics (GET): Telemetry dashboard
│   └── /api/history (GET): Historical data for charts
│
├── UI Layer (Next.js App Router)
│   ├── Dashboard: Real-time price + predictions
│   ├── Metrics Panel: Accuracy, latency, PnL
│   ├── Charts: Price history, indicator overlays
│   └── Role Views: Toggle DS/DA/ML/BA perspectives
│
└── Telemetry (Vercel KV - Optional)
    ├── Predictions: last 1000 (rolling window)
    ├── Metrics: hourly aggregates
    ├── System: latency, errors, uptime
    └── Cron: Hourly rollups (keep KV small)
```

## Phase-by-Phase Development

### Phase 1: Foundation

**Goal**: Working real-time stream, no data downloads

What I did:
- Initialized Next.js 14 with App Router, TypeScript, Tailwind
- Implemented `/api/stream` with CoinGecko API
- Built basic UI with price display and SSE connection
- Deployed to Vercel to verify streaming works

No downloads needed: CoinGecko free tier = 10-50 calls/min

### Phase 2: Feature Engineering

**Goal**: Compute indicators in real-time

What I did:
- Created `lib/features.ts` with EMA, MACD, RSI, volatility functions
- Implemented rolling window buffers (in-memory, last 100 ticks)
- Updated `/api/stream` to include computed features
- Added UI to display indicators in real-time

Storage: Only last 100 ticks in memory (few KB)

### Phase 3: Model Training

**Goal**: Train model on cloud-fetched data, export weights

What I did:
- Created Python script: `scripts/train_nn.py`
- Fetches last 7-365 days of OHLCV from CoinGecko (on-demand)
- Computes features + labels (next-k return > 0)
- Trains Neural Network
- Exports to TensorFlow.js format in `public/`
- Also created Kaggle training script for GPU training

Data size: 7 days OHLCV = ~2016 candles × ~100 bytes = ~200KB (one-time fetch)

### Phase 4: Inference

**Goal**: Edge prediction endpoint

What I did:
- Created `lib/model.ts`: Load TensorFlow.js model, standardize, predict
- Built `/api/predict`: POST endpoint (Edge runtime)
- Client calls predict on each tick
- UI displays prediction probability

Latency target: <150ms end-to-end (achieved!)

### Phase 5: Telemetry

**Goal**: Track metrics in Vercel KV (optional)

What I did:
- Created `lib/kv.ts`: Helper functions for KV operations
- Log predictions with metadata (prob, label, y_true, ms)
- Metrics aggregation: hourly rollups
- Built `/api/metrics`: Return current stats
- Made it optional - app works without storage

KV storage: ~1KB per prediction × 1000 = 1MB max (well within free tier)

### Phase 6: Dashboard & Metrics

**Goal**: Professional UI with role flexibility

What I did:
- Built main dashboard: Price chart, indicators, predictions
- Added metrics panel: Accuracy, precision, recall, latency, PnL
- Created interactive charts with Recharts
- Added forecast slider for future predictions
- Made it responsive and mobile-friendly

### Phase 7: Polish & Deploy

**Goal**: Production-ready, recruiter-ready

What I did:
- Added error handling: API failures, reconnection logic
- Implemented loading states, skeleton screens
- Wrote comprehensive README and documentation
- Created environment variables setup (.env.example)
- Deployed to Vercel production
- Tested end-to-end flow

## Role Adaptation Strategy

I designed the codebase so it can be presented from different perspectives:

### Data Scientist View
- Feature importance visualization
- Model diagnostics (ROC curve, calibration)
- A/B testing framework (model versions)
- Hyperparameter tuning interface

### Data Analyst View
- Business KPIs: win rate, Sharpe ratio, max drawdown
- Time-series trends (daily/weekly patterns)
- Correlation analysis (BTC vs ETH)
- Export to CSV functionality

### ML Engineer View
- Model versioning (different model files)
- Inference latency monitoring
- Model drift detection
- A/B testing infrastructure

### Business Analyst View
- ROI calculator (hypothetical trading strategy)
- Risk metrics (VaR, volatility)
- Market regime detection
- Executive summary dashboard

Implementation: Single codebase, role-specific UI components toggled via query param or dropdown.

## Data Strategy: Zero Downloads

### Real-time Data
- Source: CoinGecko API (free, no auth)
- Endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`
- Rate limit: 10-50 calls/min (sufficient for 3-5s polling)
- Storage: None (stream directly to client)

### Historical Data (Training)
- Source: CoinGecko OHLCV API
- Endpoint: `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=7`
- When: On-demand during training (not stored)
- Size: 7 days = ~2016 candles × ~100 bytes = ~200KB (fetched once, processed, discarded)
- Storage: Only final model files (~200KB)

### Metrics Storage
- Where: Vercel KV (Upstash)
- What: 
  - Last 1000 predictions (rolling)
  - Hourly aggregates (last 7 days)
  - System metrics (latency, errors)
- Size: <5MB total (well within free tier)

### Alternative APIs (if needed)
- Binance WebSocket (real-time, free)
- CryptoCompare (free tier: 100k calls/month)
- Alpha Vantage (free: 5 calls/min)

## Tech Stack (All Free Tier Compatible)

- Frontend: Next.js 14 (App Router), React, Tailwind CSS
- Backend: Vercel Edge Functions
- Database: Vercel KV (Upstash) - 10K reads/day free
- Streaming: Server-Sent Events (SSE)
- Model: Neural Network (TensorFlow.js)
- Training: Python + TensorFlow/Keras (run locally or Kaggle)
- Deployment: Vercel (free tier: 100GB bandwidth/month)

## Success Metrics

### Technical
- Sub-150ms prediction latency
- 99%+ uptime (Vercel SLA)
- <5MB total storage usage
- Zero local data requirements

### Model Performance
- Accuracy: 55-65% (better than random)
- Precision/Recall: Balanced
- ROC-AUC: >0.60
- Sharpe ratio: Positive (on backtest)

### Business
- Live demo URL
- Clean GitHub repo
- Clear documentation
- Metrics dashboard

## Quick Start (After Setup)

1. Train model (one-time):
   ```bash
   python scripts/train_nn.py 7
   # Or use Kaggle for GPU training
   ```

2. Deploy:
   ```bash
   vercel deploy
   ```

3. Monitor:
   - Visit `/api/metrics` for telemetry
   - Check Vercel KV dashboard for storage

## Future Enhancements (Post-MVP)

- Multi-asset support (ETH, SOL, etc.)
- Ensemble models (combine multiple predictions)
- Sentiment analysis (Twitter/Reddit API)
- WebSocket upgrade (lower latency)
- Model retraining automation (weekly Cron)
- Advanced visualizations (TradingView-style charts)

## Notes

- No data downloads: Everything fetched on-demand
- Minimal storage: Only model files in Git
- Role-flexible: Same code, different presentations
- Production-ready: Deployable today, scalable tomorrow
