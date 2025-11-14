# Crypto Micro-Terminal

A real-time cryptocurrency prediction system that streams live BTC/ETH price data, computes technical indicators, and predicts next-minute price direction using machine learning. Deployed on Vercel Edge with sub-150ms inference latency and zero local storage requirements.
<img width="602" height="747" alt="Screenshot 2025-11-14 141635" src="https://github.com/user-attachments/assets/1e8bffc5-b89c-4b45-b6a9-f82100bc0292" />

## Overview

This project demonstrates a complete end-to-end machine learning system for real-time financial predictions, featuring:

- Real-time data streaming via Server-Sent Events (SSE)
- Edge-based ML inference using TensorFlow.js
- Cloud-first architecture with zero local data storage
- Production deployment on Vercel Edge Functions
- Comprehensive telemetry and monitoring

## Key Features

**Real-Time Data Processing**
- Live price streaming from CoinGecko API
- Server-Sent Events (SSE) for low-latency updates
- Real-time technical indicator computation (RSI, MACD, Bollinger Bands, volatility)

**Machine Learning Inference**
- Neural network model (TensorFlow.js) for price direction prediction
- Sub-150ms inference latency on Vercel Edge
- 11 engineered features including returns, volatility, and momentum indicators
- Model trained on GPU (Kaggle) for optimal performance

**Production Architecture**
- Edge functions for global low-latency deployment
- Optional KV storage for telemetry and metrics
- Zero-download data strategy (all data fetched on-demand)
- Scalable serverless infrastructure

**Developer Experience**
- TypeScript throughout for type safety
- Modular architecture with clear separation of concerns
- Comprehensive documentation and setup guides
- Role-adaptable presentation (DS/DA/ML/BA perspectives)

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

## Technology Stack

**Frontend**
- Next.js 14 (App Router)
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization

**Backend**
- Vercel Edge Functions
- Server-Sent Events (SSE) for streaming
- TensorFlow.js for ML inference
- Vercel KV for optional telemetry storage

**Machine Learning**
- Neural Network (32→16→8→1 architecture)
- 11 engineered features
- Training: Python + TensorFlow/Keras
- Deployment: TensorFlow.js on Edge

**Data Sources**
- CoinGecko API (real-time prices)
- CoinGecko OHLCV API (historical data for training)

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Python 3.8+ (for local training, optional)
- Vercel account (free tier sufficient)
- Kaggle account (recommended for GPU training)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/crypto-microterminal.git
   cd crypto-microterminal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional - storage is optional):
   ```bash
   cp .env.example .env.local
   ```
   
   Add Vercel KV credentials if using telemetry:
   ```env
   KV_REST_API_URL=your_kv_url
   KV_REST_API_TOKEN=your_kv_token
   ```

4. Train the model:

   **Option A: Kaggle GPU Training (Recommended)**
   - See [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) for detailed instructions
   - Train on large datasets with free GPU access
   - Download model files and place in `public/` folder

   **Option B: Local Training (CPU)**
   ```bash
   python scripts/train_nn.py 7
   ```
   This trains a neural network locally using 7 days of historical data.

5. Run development server:
   ```bash
   npm run dev
   ```

6. Deploy to Vercel:
   - Push to GitHub
   - Import project in Vercel dashboard
   - Deploy (see [DEPLOYMENT_NO_STORAGE.md](./DEPLOYMENT_NO_STORAGE.md) for details)

## Data Strategy

**Zero Local Storage Architecture**

This project implements a cloud-first approach requiring zero local data storage:

- **Real-time Data**: Fetched on-demand from CoinGecko API (10-50 calls/min free tier)
- **Training Data**: Fetched on-demand during training (~300KB, processed then discarded)
- **Model Storage**: Only model weights (~50-200KB) committed to repository
- **Telemetry**: Optional Vercel KV storage (<5MB for metrics)

**Benefits**
- No large dataset downloads required
- Always uses fresh, up-to-date data
- Minimal storage footprint
- Scalable cloud infrastructure

## Model Architecture

**Neural Network**
- Input: 11 engineered features
- Architecture: 32 → 16 → 8 → 1 neurons
- Activation: ReLU (hidden), Sigmoid (output)
- Regularization: Dropout (0.2-0.3)
- Total parameters: ~1,000 (lightweight for edge deployment)

**Features**
1. Returns: 5s, 15s, 30s, 60s windows
2. Volatility: 30s and 60s rolling standard deviation
3. Technical Indicators: RSI(14), MACD
4. Market Position: Bollinger Bands position
5. Momentum: Price momentum and volume trends

**Training**
- Dataset: 7-365 days of BTC OHLCV data
- Validation split: 80/20
- Early stopping: Prevents overfitting
- Learning rate scheduling: Adaptive optimization

**Performance**
- Accuracy: 55-65% (better than random 50%)
- Inference latency: <50ms on Vercel Edge
- Model size: ~50-200KB (gzipped)

## API Endpoints

**Real-Time Streaming**
- `GET /api/stream` - Server-Sent Events stream of live price ticks and computed indicators
  - Updates every 3 seconds
  - Includes: price, returns, volatility, RSI, MACD, Bollinger Bands

**Prediction**
- `POST /api/predict` - Model inference endpoint
  - Input: Feature vector (11 features)
  - Output: Probability and binary label (up/down)
  - Latency: <150ms end-to-end

**Telemetry**
- `GET /api/metrics` - Current system metrics and model performance
  - Returns: accuracy, precision, recall, latency statistics
  - Optional: Requires KV storage for historical data

**Historical Data**
- `GET /api/history?hours=24` - Fetch historical price data for charting
  - Returns: Last N hours of price data from CoinGecko

## Project Structure

```
crypto-microterminal/
├── app/
│   ├── api/
│   │   ├── stream/route.ts      # SSE streaming endpoint
│   │   ├── predict/route.ts     # ML inference endpoint
│   │   ├── metrics/route.ts     # Telemetry endpoint
│   │   └── history/route.ts     # Historical data endpoint
│   ├── page.tsx                 # Main dashboard UI
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── lib/
│   ├── features.ts              # Technical indicator computation
│   ├── model.ts                 # TensorFlow.js model inference
│   └── kv.ts                    # Vercel KV helpers (optional)
├── scripts/
│   ├── train.py                 # Logistic regression training
│   └── train_nn.py              # Neural network training
├── kaggle/
│   ├── train_model.py           # Kaggle GPU training script
│   └── KAGGLE_SETUP.md          # Kaggle setup guide
├── public/
│   ├── model/                   # TensorFlow.js model files
│   └── scaler-params.json       # Feature scaling parameters
├── DEPLOYMENT_NO_STORAGE.md     # Simplified deployment guide
├── VERCEL_DEPLOYMENT.md         # Complete deployment guide
└── README.md                    # This file
```

## Configuration

### Vercel KV Setup (Optional)

Storage is optional - the application works without it. To enable telemetry:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → KV (or use Upstash from Marketplace)
3. Copy connection strings to environment variables
4. Redeploy application

### Model Training

**Kaggle GPU Training (Recommended)**
- See [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md)
- Free GPU access (T4 x2)
- Train on large datasets (365+ days)
- Export to TensorFlow.js format

**Local Training**
```bash
# Install dependencies
pip install tensorflow tensorflowjs scikit-learn numpy requests

# Train neural network
python scripts/train_nn.py 7

# Model files will be created in public/
```

## Metrics and Monitoring

**Tracked Metrics** (when storage is enabled)
- Prediction accuracy and precision/recall
- Average inference latency
- System uptime and error rates
- Rolling performance statistics

**Access Metrics**
- API endpoint: `/api/metrics`
- Returns JSON with current statistics
- Updates in real-time as predictions are made

## Deployment

**Vercel Deployment**

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure build settings (auto-detected for Next.js)
4. Deploy (no environment variables required for basic functionality)

See [DEPLOYMENT_NO_STORAGE.md](./DEPLOYMENT_NO_STORAGE.md) for simplified deployment steps.

**Environment Variables** (Optional)
- `KV_REST_API_URL` - Vercel KV connection URL
- `KV_REST_API_TOKEN` - Vercel KV authentication token

## Role Adaptation

The codebase can be presented from different professional perspectives:

**Data Scientist**
- Feature engineering and selection
- Model architecture and hyperparameter tuning
- Performance metrics and diagnostics
- A/B testing framework

**Data Analyst**
- Business KPIs and trend analysis
- Correlation and pattern identification
- Data visualization and reporting
- Statistical significance testing

**ML Engineer**
- Model deployment and serving
- Edge inference optimization
- Latency and performance monitoring
- Model versioning and CI/CD

**Business Analyst**
- ROI and profitability analysis
- Risk metrics and scenario planning
- Executive dashboards
- Strategy backtesting

## Performance Characteristics

**Latency**
- Edge inference: <50ms
- End-to-end prediction: <150ms
- Real-time streaming: 3-second updates

**Scalability**
- Serverless architecture scales automatically
- Edge functions deployed globally
- No database bottlenecks (stateless design)

**Resource Usage**
- Model size: 50-200KB
- Memory: <100MB per function
- Storage: <5MB (optional telemetry)

## Documentation

- [ROADMAP.md](./ROADMAP.md) - Detailed development roadmap
- [MINDMAP.md](./MINDMAP.md) - Visual architecture diagrams
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_NO_STORAGE.md](./DEPLOYMENT_NO_STORAGE.md) - Simplified deployment
- [TRAINING.md](./TRAINING.md) - Model training guide
- [kaggle/KAGGLE_SETUP.md](./kaggle/KAGGLE_SETUP.md) - Kaggle GPU training setup

## Technical Highlights

**Edge Computing**
- Deployed on Vercel Edge Functions for global low-latency
- TensorFlow.js runs efficiently in Edge runtime
- No cold start issues with optimized model size

**Real-Time Processing**
- Server-Sent Events for efficient one-way streaming
- In-memory indicator computation
- Minimal latency between data and predictions

**Cloud-First Design**
- Zero local storage requirements
- All data fetched on-demand
- Stateless architecture for horizontal scaling

**Production Ready**
- Error handling and graceful degradation
- Optional telemetry for monitoring
- Type-safe TypeScript implementation
- Comprehensive documentation

## License

MIT License - see LICENSE file for details

## Acknowledgments

- CoinGecko for providing free cryptocurrency API access
- Vercel for hosting infrastructure and Edge Functions
- TensorFlow.js team for edge ML capabilities
- Kaggle for free GPU compute resources

## Contact

For questions or feedback, please open an issue on GitHub.

---

Built with modern web technologies and production best practices. Suitable for portfolio demonstration, technical interviews, and learning advanced full-stack ML systems.
