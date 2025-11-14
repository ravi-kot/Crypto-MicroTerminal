# Crypto Micro-Terminal: Visual Mindmap

## 🧠 Project Architecture Mindmap

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRYPTO MICRO-TERMINAL                        │
│              (Cloud-First, Zero-Download Approach)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   DATA LAYER          FEATURE ENGINEERING      MODEL LAYER
   (Cloud APIs)        (Real-time Compute)      (Edge Inference)
        │                     │                     │
        │                     │                     │
   ┌────┴────┐          ┌─────┴─────┐         ┌────┴────┐
   │         │          │           │         │         │
   ▼         ▼          ▼           ▼         ▼         ▼
┌─────┐  ┌──────┐   ┌──────┐  ┌────────┐  ┌─────┐  ┌──────┐
│Real │  │Hist. │   │Returns│  │Momentum│  │Train│  │Infer │
│Time │  │(48h) │   │r_5s  │  │EMA/MACD│  │(LR) │  │(Edge)│
│SSE  │  │On-Dmd│   │r_15s │  │RSI(14) │  │     │  │      │
└─────┘  └──────┘   │r_30s │  │Volatility│ │     │  │      │
                    │r_60s │  └────────┘  │     │  │      │
                    └──────┘              └─────┘  └──────┘
        │                     │                     │
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   API LAYER     │
                    │ (Vercel Edge)   │
                    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌────────┐          ┌──────────┐          ┌──────────┐
   │/stream │          │/predict  │          │/metrics  │
   │(SSE)   │          │(POST)    │          │(GET)     │
   └────────┘          └──────────┘          └──────────┘
        │                     │                     │
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   UI LAYER      │
                    │  (Next.js App)  │
                    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌────────┐          ┌──────────┐          ┌──────────┐
   │Dashboard│         │Metrics   │          │Role Views│
   │(Price)  │         │(Accuracy)│          │DS/DA/ML/BA│
   └────────┘          └──────────┘          └──────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  TELEMETRY      │
                    │  (Vercel KV)    │
                    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌────────┐          ┌──────────┐          ┌──────────┐
   │Predicts│          │Aggregates│          │System    │
   │(1000)  │          │(Hourly)  │          │(Latency) │
   └────────┘          └──────────┘          └──────────┘
```

---

## 🎯 Role Adaptation Mindmap

```
                    PROJECT CORE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   DATA SCIENTIST    DATA ANALYST    ML ENGINEER    BUSINESS ANALYST
        │                │                │                │
        │                │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │         │      │         │      │         │      │         │
   ▼         ▼      ▼         ▼      ▼         ▼      ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Feature│ │Model │ │KPIs  │ │Trends│ │Model │ │Infer │ │ROI   │ │Risk  │
│Import │ │Diag  │ │Win%  │ │Daily │ │Vers. │ │Lat.  │ │Calc  │ │VaR   │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │         │         │         │         │         │         │         │
   └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  UNIFIED CODE   │
                    │  (Role Toggle)  │
                    └─────────────────┘
```

---

## 📊 Data Flow Mindmap

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW (Zero Download)                │
└─────────────────────────────────────────────────────────────┘

EXTERNAL APIs (On-Demand Fetch)
        │
        ├── CoinGecko Real-time (every 3s)
        │   └──> /api/stream (SSE)
        │       └──> Client (React)
        │
        ├── CoinGecko OHLCV (training only)
        │   └──> scripts/train.py
        │       └──> Process → Train → Export weights
        │
        └── Alternative: Binance WebSocket
            └──> Fallback if rate limits hit

IN-MEMORY BUFFERS (Temporary, No Persistence)
        │
        ├── Last 100 ticks (for indicators)
        ├── Feature vectors (for prediction)
        └── Rolling windows (EMA, RSI, etc.)

VERCEL KV (Minimal Storage)
        │
        ├── Predictions: last 1000 (rolling)
        ├── Metrics: hourly aggregates (7 days)
        └── System: latency, errors, uptime

NO LOCAL FILES
        │
        └── Only weights-lr.json (5KB, versioned in Git)
```

---

## 🛠️ Technology Stack Mindmap

```
                    TECH STACK
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   FRONTEND          BACKEND          STORAGE
        │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │         │      │         │      │         │
   ▼         ▼      ▼         ▼      ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Next  │ │React │ │Edge  │ │SSE   │ │Vercel│ │Upstash│
│JS 14 │ │18+   │ │Funcs │ │Stream│ │KV    │ │Redis  │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │         │         │         │         │         │
   └─────────┴─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  DEPLOYMENT     │
                    │  (Vercel Free)  │
                    └─────────────────┘
```

---

## 🎓 Learning Path Mindmap

```
                    YOUR LEARNING JOURNEY
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   DAY 1            DAY 2-3          DAY 4+
        │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │         │      │         │      │         │
   ▼         ▼      ▼         ▼      ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Setup │ │Stream│ │Train │ │Deploy│ │Polish│ │Extend│
│Proj  │ │Data  │ │Model │ │Vercel│ │UI    │ │Feat  │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │         │         │         │         │         │
   └─────────┴─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  PORTFOLIO      │
                    │  READY PROJECT  │
                    └─────────────────┘
```

---

## 💡 Key Decisions Mindmap

```
                    ARCHITECTURE DECISIONS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   NO DOWNLOADS      CLOUD-FIRST      ROLE-FLEXIBLE
        │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │         │      │         │      │         │
   ▼         ▼      ▼         ▼      ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│API   │ │On-   │ │Edge  │ │KV    │ │Single│ │Toggle│
│Fetch │ │Demand│ │Funcs │ │Store │ │Code  │ │Views │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │         │         │         │         │         │
   └─────────┴─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  ZERO LOCAL     │
                    │  STORAGE NEEDED │
                    └─────────────────┘
```

---

## 📈 Success Metrics Mindmap

```
                    SUCCESS METRICS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   TECHNICAL         MODEL            BUSINESS
        │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │         │      │         │      │         │
   ▼         ▼      ▼         ▼      ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│<150ms│ │99%+  │ │>55%  │ │ROC   │ │Live  │ │Clean │
│Lat.  │ │Uptime│ │Acc.  │ │AUC   │ │Demo  │ │Repo  │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   │         │         │         │         │         │
   └─────────┴─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  RECRUITER      │
                    │  READY          │
                    └─────────────────┘
```

