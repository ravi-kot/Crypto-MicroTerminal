# Crypto Micro-Terminal: Cloud-First Roadmap
## Zero Local Storage Required 🚀

---

## 🎯 Project Philosophy: Cloud-Native, Role-Flexible

This project is designed to be:
- **Zero-download**: All data fetched on-demand from free APIs
- **Role-adaptable**: Same codebase, different presentations (DS/DA/ML/BA)
- **Production-ready**: Deployable on Vercel Free tier
- **Recruiter-friendly**: Live demo, clean metrics, clear value prop

---

## 📊 Mindmap Overview

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
│   ├── Model: Logistic Regression (weights as JSON)
│   ├── Inference: Pure TS on Edge (<150ms)
│   └── Versioning: weights-lr-v1.json, weights-lr-v2.json
│
├── API Layer (Vercel Edge Functions)
│   ├── /api/stream (SSE): Real-time ticks + indicators
│   ├── /api/predict (POST): Model inference
│   ├── /api/metrics (GET): Telemetry dashboard
│   ├── /api/train (POST): Trigger retraining (optional)
│   └── /api/backtest (GET): Historical performance
│
├── UI Layer (Next.js App Router)
│   ├── Dashboard: Real-time price + predictions
│   ├── Metrics Panel: Accuracy, latency, PnL
│   ├── Charts: Price history, indicator overlays
│   └── Role Views: Toggle DS/DA/ML/BA perspectives
│
└── Telemetry (Vercel KV)
    ├── Predictions: last 1000 (rolling window)
    ├── Metrics: hourly aggregates
    ├── System: latency, errors, uptime
    └── Cron: Hourly rollups (keep KV small)
```

---

## 🗺️ Phase-by-Phase Roadmap

### **Phase 1: Foundation (Day 1 - 4 hours)**
**Goal**: Working real-time stream, no data downloads

- [x] Initialize Next.js 14 (App Router) + TypeScript + Tailwind
- [ ] Set up Vercel KV (Upstash) connection
- [ ] Implement `/api/stream` with CoinGecko API
- [ ] Basic UI: price display + SSE connection
- [ ] Deploy to Vercel (verify streaming works)

**No downloads needed**: CoinGecko free tier = 10-50 calls/min

---

### **Phase 2: Feature Engineering (Day 1 - 2 hours)**
**Goal**: Compute indicators in real-time

- [ ] `lib/features.ts`: EMA, MACD, RSI, volatility functions
- [ ] Rolling window buffers (in-memory, last 100 ticks)
- [ ] Update `/api/stream` to include computed features
- [ ] UI: Display indicators in real-time

**Storage**: Only last 100 ticks in memory (few KB)

---

### **Phase 3: Model Training (Day 1 - 1.5 hours)**
**Goal**: Train LR on cloud-fetched data, export weights

- [ ] Python script: `scripts/train.py`
  - Fetches last 48h of OHLCV from CoinGecko (on-demand)
  - Computes features + labels (next-k return > 0)
  - Trains Logistic Regression
  - Exports `weights-lr.json` to `public/`
- [ ] Run once locally (or on GitHub Actions)
- [ ] Commit weights to repo (versioned)

**Data size**: 48h OHLCV = ~2880 candles × ~100 bytes = ~300KB (one-time fetch)

---

### **Phase 4: Inference (Day 1 - 1 hour)**
**Goal**: Edge prediction endpoint

- [ ] `lib/model.ts`: Load weights, standardize, predict
- [ ] `/api/predict`: POST endpoint (Edge runtime)
- [ ] Client: Call predict on each tick
- [ ] UI: Display prediction probability

**Latency target**: <150ms end-to-end

---

### **Phase 5: Telemetry (Day 1 - 1.5 hours)**
**Goal**: Track metrics in Vercel KV

- [ ] `lib/kv.ts`: Helper functions for KV operations
- [ ] Log predictions: `predictions:{timestamp}` → `{prob, label, y_true, ms}`
- [ ] Metrics aggregation: hourly rollups
- [ ] `/api/metrics`: Return current stats
- [ ] Vercel Cron: Hourly cleanup (keep last 24h only)

**KV storage**: ~1KB per prediction × 1000 = 1MB max (well within free tier)

---

### **Phase 6: Dashboard & Metrics (Day 1 - 2 hours)**
**Goal**: Professional UI with role flexibility

- [ ] Main dashboard: Price chart, indicators, predictions
- [ ] Metrics panel: Accuracy, precision, recall, latency, PnL
- [ ] Role toggle: Switch between DS/DA/ML/BA views
  - **DS**: Feature importance, model diagnostics
  - **DA**: Business metrics, KPIs, trends
  - **ML**: Model performance, confusion matrix
  - **BA**: ROI, strategy backtest, risk metrics
- [ ] Responsive design (mobile-friendly)

---

### **Phase 7: Polish & Deploy (Day 1 - 1 hour)**
**Goal**: Production-ready, recruiter-ready

- [ ] Error handling: API failures, reconnection logic
- [ ] Loading states, skeleton screens
- [ ] README with setup instructions
- [ ] Environment variables setup (.env.example)
- [ ] Deploy to Vercel production
- [ ] Test end-to-end flow

---

## 🔄 Role Adaptation Strategy

### **Data Scientist View**
- Feature importance visualization
- Model diagnostics (ROC curve, calibration)
- A/B testing framework (model versions)
- Hyperparameter tuning interface

### **Data Analyst View**
- Business KPIs: win rate, Sharpe ratio, max drawdown
- Time-series trends (daily/weekly patterns)
- Correlation analysis (BTC vs ETH)
- Export to CSV functionality

### **ML Engineer View**
- Model versioning (weights-lr-v1, v2, etc.)
- Inference latency monitoring
- Model drift detection
- A/B testing infrastructure

### **Business Analyst View**
- ROI calculator (hypothetical trading strategy)
- Risk metrics (VaR, volatility)
- Market regime detection
- Executive summary dashboard

**Implementation**: Single codebase, role-specific UI components toggled via query param or dropdown.

---

## 📦 Data Strategy: Zero Downloads

### **Real-time Data**
- **Source**: CoinGecko API (free, no auth)
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`
- **Rate limit**: 10-50 calls/min (sufficient for 3-5s polling)
- **Storage**: None (stream directly to client)

### **Historical Data (Training)**
- **Source**: CoinGecko OHLCV API
- **Endpoint**: `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=2`
- **When**: On-demand during training (not stored)
- **Size**: 48h = ~300KB (fetched once, processed, discarded)
- **Storage**: Only final weights (~5KB JSON)

### **Metrics Storage**
- **Where**: Vercel KV (Upstash)
- **What**: 
  - Last 1000 predictions (rolling)
  - Hourly aggregates (last 7 days)
  - System metrics (latency, errors)
- **Size**: <5MB total (well within free tier)

### **Alternative APIs (if needed)**
- Binance WebSocket (real-time, free)
- CryptoCompare (free tier: 100k calls/month)
- Alpha Vantage (free: 5 calls/min)

---

## 🛠️ Tech Stack (All Free Tier Compatible)

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Vercel Edge Functions
- **Database**: Vercel KV (Upstash) - 10K reads/day free
- **Streaming**: Server-Sent Events (SSE)
- **Model**: Logistic Regression (weights in JSON)
- **Training**: Python + scikit-learn (run locally or GitHub Actions)
- **Deployment**: Vercel (free tier: 100GB bandwidth/month)

---

## 📈 Success Metrics (Recruiter-Friendly)

### **Technical**
- ✅ Sub-150ms prediction latency
- ✅ 99%+ uptime (Vercel SLA)
- ✅ <1MB total storage usage
- ✅ Zero local data requirements

### **Model Performance**
- Accuracy: >55% (better than random)
- Precision/Recall: Balanced
- ROC-AUC: >0.60
- Sharpe ratio: Positive (on backtest)

### **Business**
- Live demo URL
- Clean GitHub repo
- Clear documentation
- Metrics dashboard

---

## 🚀 Quick Start (After Setup)

1. **Train model** (one-time):
   ```bash
   python scripts/train.py
   # Fetches 48h data, trains, exports weights-lr.json
   ```

2. **Deploy**:
   ```bash
   vercel deploy
   ```

3. **Monitor**:
   - Visit `/api/metrics` for telemetry
   - Check Vercel KV dashboard for storage

---

## 🔮 Future Enhancements (Post-MVP)

- Multi-asset support (ETH, SOL, etc.)
- Ensemble models (combine multiple predictions)
- Sentiment analysis (Twitter/Reddit API)
- WebSocket upgrade (lower latency)
- Model retraining automation (weekly Cron)
- Advanced visualizations (TradingView-style charts)

---

## 📝 Notes

- **No data downloads**: Everything fetched on-demand
- **Minimal storage**: Only aggregated metrics in KV
- **Role-flexible**: Same code, different presentations
- **Production-ready**: Deployable today, scalable tomorrow

