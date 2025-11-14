# Setup Guide

Quick setup guide to get the project running locally.

## Quick Setup

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (only if you want to train locally)
pip install -r requirements.txt
```

### Step 2: Environment Variables (Optional)

The app works without storage, but if you want telemetry:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get Vercel KV credentials (optional):
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Storage → Create Database → KV (or use Upstash from Marketplace)
   - Copy the credentials to `.env.local`

### Step 3: Train Model (Optional)

I've included default model weights, but you can train your own:

```bash
python scripts/train_nn.py 7
```

This will:
- Fetch 7 days of BTC data from CoinGecko (on-demand, no storage)
- Train a neural network
- Export model files to `public/`

**Note**: Requires internet connection but only uses ~300KB of data temporarily.

### Step 4: Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

You should see the dashboard with real-time price streaming and predictions.

### Step 5: Deploy to Vercel

I recommend deploying via the Vercel dashboard - it's simpler:

1. Push code to GitHub
2. Import project in Vercel
3. Click deploy

See [DEPLOYMENT_NO_STORAGE.md](./DEPLOYMENT_NO_STORAGE.md) for details.

## Troubleshooting

**KV connection failed?**
- That's fine - the app works without it
- Storage is only for telemetry/metrics
- Core functionality (predictions, streaming) works perfectly

**Failed to fetch price?**
- CoinGecko free tier has rate limits (10-50 calls/min)
- The app polls every 3 seconds, which should be fine
- If you hit limits, wait a minute or get a free API key

**Model prediction failed?**
- Check that `public/model/` folder exists
- Or run the training script to generate model files
- The app will use a fallback model if files are missing

**Python training script fails?**
- Make sure Python 3.8+ is installed
- Install dependencies: `pip install -r requirements.txt`
- Check internet connection (needs to fetch from CoinGecko)

## Storage Requirements

**Zero local storage needed!**

- Training: Fetches ~300KB temporarily, then discards
- Runtime: Only stores metrics in Vercel KV (<5MB) if you enable it
- Model: Weights are ~200KB (committed to Git)

## Next Steps

1. Get it running locally
2. Test the real-time streaming
3. Deploy to Vercel
4. Share your live URL!

See [ROADMAP.md](./ROADMAP.md) if you want to understand the development process.
