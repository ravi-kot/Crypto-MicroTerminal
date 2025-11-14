# Cloud-First Approach: Zero Local Storage Required

## 🎯 Problem Solved

**Your constraint**: Limited local storage space, can't download large datasets.

**Our solution**: Everything fetched on-demand from free APIs, minimal storage usage.

---

## 📊 Storage Breakdown

### What We DON'T Store Locally

❌ **No historical price data** (typically GBs)
❌ **No tick-by-tick databases** (could be TBs)
❌ **No preprocessed datasets** (hundreds of MBs)
❌ **No model checkpoints** (except tiny weights JSON)

### What We DO Store

✅ **Model weights**: `public/weights-lr.json` (~5KB)
   - Committed to Git
   - Version controlled
   - Can be regenerated anytime

✅ **Aggregated metrics in Vercel KV**: <5MB total
   - Last 1000 predictions (rolling window)
   - Hourly aggregates (last 7 days)
   - System telemetry

---

## 🔄 Data Flow (Zero Downloads)

### Real-Time Data

```
CoinGecko API (every 3s)
    ↓
Edge Function (/api/stream)
    ↓
SSE Stream to Client
    ↓
In-Memory Buffers (last 100 ticks)
    ↓
Discarded (no persistence)
```

**Storage used**: ~10KB in-memory (temporary)

### Training Data

```
Training Script Runs
    ↓
Fetches 48h OHLCV from CoinGecko (~300KB)
    ↓
Processes in memory
    ↓
Trains model
    ↓
Exports weights (~5KB JSON)
    ↓
Original data discarded
```

**Storage used**: 
- During training: ~300KB (temporary, in-memory)
- After training: ~5KB (weights file)

### Metrics Storage

```
Predictions Made
    ↓
Logged to Vercel KV
    ↓
Hourly Cron Aggregates
    ↓
Old data auto-expires (24h for raw, 7d for aggregates)
```

**Storage used**: <5MB in Vercel KV (cloud, not local)

---

## 💡 Key Design Decisions

### 1. On-Demand Fetching

Instead of downloading and storing historical data:
- **Training**: Fetches only what's needed (48h) when training runs
- **Runtime**: Fetches current price every 3s, never stores

**Benefit**: Zero local storage, always fresh data

### 2. In-Memory Buffers

Instead of persisting tick data:
- Keep last 100 ticks in memory (for indicators)
- Discard older data automatically
- No database needed

**Benefit**: Fast, lightweight, no disk I/O

### 3. Cloud Telemetry

Instead of local logging:
- Store metrics in Vercel KV (cloud)
- Auto-expire old data
- Accessible from anywhere

**Benefit**: No local storage, scalable, accessible

### 4. Minimal Model Storage

Instead of storing full model artifacts:
- Only store weights as JSON (~5KB)
- Model code is in TypeScript (versioned in Git)
- Can regenerate weights anytime

**Benefit**: Tiny footprint, version controlled

---

## 📈 Storage Comparison

| Approach | Local Storage | Cloud Storage | Notes |
|----------|--------------|---------------|-------|
| **Traditional** | 10-100 GB | 0 | Downloads historical data |
| **This Project** | **~5 KB** | **<5 MB** | Everything on-demand |

**Savings**: ~99.99% reduction in local storage!

---

## 🚀 How It Works

### During Development

1. **No data downloads**: Just `npm install` and go
2. **Training**: Run `python scripts/train.py` → fetches data → trains → exports weights → done
3. **Runtime**: Streams live data, never stores

### During Deployment

1. **Vercel KV**: Stores metrics in cloud (free tier: 10K reads/day)
2. **Edge Functions**: No local storage needed
3. **Model Weights**: Bundled with app (~5KB)

---

## 🔧 Alternative APIs (If Needed)

If CoinGecko rate limits become an issue:

1. **Binance WebSocket** (free, real-time)
2. **CryptoCompare** (free tier: 100K calls/month)
3. **Alpha Vantage** (free: 5 calls/min)

All work the same way: fetch on-demand, no storage.

---

## ✅ Benefits Summary

1. **Zero local storage**: Perfect for limited disk space
2. **Always fresh**: Data fetched in real-time
3. **Scalable**: Cloud storage grows with usage
4. **Portable**: Works on any machine with internet
5. **Cost-effective**: Free tiers sufficient for MVP

---

## 🎓 For Your Resume

> "Designed cloud-first architecture with zero local data storage, fetching all data on-demand from free APIs. Reduced storage footprint by 99.99% while maintaining real-time performance."

---

## 📝 Next Steps

1. ✅ Project structure ready
2. ✅ Cloud-first approach implemented
3. ⏭️ Train model (optional, uses ~300KB temporarily)
4. ⏭️ Deploy to Vercel
5. ⏭️ Share live URL!

**You're ready to go!** 🚀

