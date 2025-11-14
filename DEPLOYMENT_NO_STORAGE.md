# Deploy to Vercel (No Storage Required)

Simplified deployment guide - no database setup needed!

## What Works Without Storage

- Real-time price streaming
- Live predictions
- Interactive charts
- All UI features
- Metrics endpoint returns empty data (but doesn't break)

## Quick Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 3: Import Project

1. Vercel Dashboard → "Add New..." → "Project"
2. Find your GitHub repository
3. Click "Import"

### Step 4: Configure Project

- Framework Preset: Next.js (auto-detected)
- Root Directory: `./` (default)
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

**No environment variables needed!** Skip that step.

### Step 5: Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes
3. Click "Visit" when ready

## Done!

Your app is live at: `https://your-app.vercel.app`

That's it! No database setup, no environment variables, no configuration needed.

## Notes

- Metrics endpoint (`/api/metrics`) will return empty data but won't break
- Predictions work perfectly without storage
- Real-time streaming works perfectly
- Charts work perfectly

Storage is only for telemetry/metrics tracking, which is optional for a demo.

## Adding Storage Later (Optional)

If you want to add metrics tracking later:

1. Create Upstash Redis in Vercel Marketplace
2. Add environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Redeploy

The code already supports it - just add the credentials!

## Success!

Your Crypto Micro-Terminal is now live on Vercel!

**Share your deployment:**
- Live URL: `https://your-app.vercel.app`
- GitHub repo: `https://github.com/your-username/your-repo`
