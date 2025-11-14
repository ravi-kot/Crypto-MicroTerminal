# Setup Guide: Crypto Micro-Terminal

## 🎯 Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for training)
pip install -r requirements.txt
```

### Step 2: Configure Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. **Get Vercel KV credentials**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage → Create Database → KV
   - Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   - Paste them into `.env.local`

### Step 3: Train Model (Optional)

The project includes default weights, but you can train your own:

```bash
python scripts/train.py
```

This will:
- Fetch 48h of BTC data from CoinGecko (on-demand, no storage)
- Train a logistic regression model
- Export weights to `public/weights-lr.json`

**Note**: This requires internet connection but uses minimal data (~300KB fetched, then discarded).

### Step 4: Run Locally

```bash
npm run dev
```

Visit: http://localhost:3000

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then deploy to production
vercel --prod
```

---

## 🔧 Troubleshooting

### Issue: "KV connection failed"

**Solution**: Make sure you've:
1. Created a KV database in Vercel
2. Copied the correct credentials to `.env.local`
3. Restarted your dev server after adding env vars

### Issue: "Failed to fetch price"

**Solution**: 
- CoinGecko free tier has rate limits (10-50 calls/min)
- The app polls every 3 seconds, which is within limits
- If you hit limits, wait a minute or get a free API key

### Issue: "Model prediction failed"

**Solution**:
- Check that `public/weights-lr.json` exists
- Verify the file is valid JSON
- Run `python scripts/train.py` to regenerate weights

### Issue: Python training script fails

**Solution**:
- Ensure Python 3.8+ is installed
- Install dependencies: `pip install -r requirements.txt`
- Check internet connection (needs to fetch from CoinGecko)

---

## 📊 Storage Requirements

**Zero local storage needed!**

- **Training**: Fetches ~300KB of data, processes, then discards
- **Runtime**: Only stores aggregated metrics in Vercel KV (<5MB)
- **Model**: Weights file is ~5KB (committed to Git)

---

## 🚀 Next Steps

1. ✅ Complete setup
2. ✅ Test locally
3. ✅ Deploy to Vercel
4. ✅ Share your live URL!

See [ROADMAP.md](./ROADMAP.md) for detailed development roadmap.

