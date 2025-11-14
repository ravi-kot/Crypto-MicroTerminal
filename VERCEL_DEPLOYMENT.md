# Vercel Deployment Guide

Complete step-by-step guide to deploy to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Project pushed to GitHub
- Model files ready (optional, can add later)

## Step-by-Step Deployment

### Step 1: Push to GitHub

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. Verify your repo is on GitHub:
   - Go to https://github.com/your-username/your-repo
   - Make sure all files are there

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub

### Step 3: Create Vercel KV Database (Optional)

Storage is optional - the app works without it. But if you want telemetry:

1. In Vercel dashboard, go to Storage tab
2. Click "Create Database" or "Browse Marketplace"
3. Select "Upstash" → "Redis"
4. Choose a name (e.g., `crypto-terminal-kv`)
5. Select region closest to you
6. Click "Create"

7. Copy credentials:
   - `UPSTASH_REDIS_REST_URL` (use as `KV_REST_API_URL`)
   - `UPSTASH_REDIS_REST_TOKEN` (use as `KV_REST_API_TOKEN`)

### Step 4: Import Project to Vercel

1. In Vercel dashboard, click "Add New..." → "Project"
2. Find your GitHub repository
3. Click "Import"

4. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. You can deploy now, or add environment variables first (optional)

### Step 5: Set Environment Variables (Optional)

Only needed if you want telemetry:

1. In your project settings, go to "Settings" → "Environment Variables"

2. Add these variables:
   ```
   KV_REST_API_URL = your_kv_url_here
   KV_REST_API_TOKEN = your_kv_token_here
   ```

3. Select environments:
   - Production
   - Preview
   - Development

4. Click "Save"

### Step 6: Deploy!

1. Go to "Deployments" tab
2. Click "Deploy" (or "Redeploy" if you added env vars)
3. Wait for build to complete (~2-3 minutes)

4. Watch the build logs:
   - Should see: "Building..."
   - Then: "Deploying..."
   - Finally: "Ready"

### Step 7: Verify Deployment

1. Click on your deployment
2. Click "Visit" to open your live site
3. Test the application:
   - Real-time price streaming
   - Predictions working
   - Chart displaying
   - Metrics endpoint: `https://your-app.vercel.app/api/metrics`

## Post-Deployment Setup

### Add Model Files (If You Have Them)

If you trained a model on Kaggle:

1. Download model files from Kaggle:
   - `model/` folder
   - `scaler-params.json`

2. Add to your project:
   ```bash
   # Locally
   cp -r model/ public/
   cp scaler-params.json public/
   ```

3. Commit and push:
   ```bash
   git add public/model/ public/scaler-params.json
   git commit -m "Add trained model"
   git push
   ```

4. Vercel will auto-deploy the new version

## Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## Monitoring

### View Logs

1. Go to "Deployments" tab
2. Click on a deployment
3. Click "Functions" tab
4. View real-time logs

### Check Metrics

- Visit: `https://your-app.vercel.app/api/metrics`
- Shows: accuracy, latency, predictions (if storage enabled)

### Vercel Analytics (Optional)

1. Go to "Analytics" tab
2. Enable (free tier available)
3. View traffic, performance metrics

## Continuous Deployment

Automatic deployments are enabled by default:

- Every push to `main` → Production deployment
- Every PR → Preview deployment
- Every branch → Preview deployment

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check `package.json` has all dependencies
- Run `npm install` locally to verify

**Error: "Environment variable missing"**
- Only needed if using storage
- App works without env vars

**Error: "Build timeout"**
- Free tier: 45 seconds max
- Optimize build: remove unused dependencies
- Consider upgrading to Pro ($20/month)

### Runtime Errors

**Error: "KV connection failed"**
- That's fine - app works without it
- Only needed for telemetry
- Core functionality works perfectly

**Error: "Model not found"**
- Check `public/model/` folder exists
- Verify `model.json` is in `public/model/`
- App will use fallback if files are missing

**Error: "API rate limit"**
- CoinGecko free tier: 10-50 calls/min
- Wait a few minutes and retry
- Consider getting CoinGecko API key

### Performance Issues

**Slow predictions:**
- Model might be too large
- Check model size: should be <200KB
- Optimize TensorFlow.js model

**High latency:**
- Check Edge function logs
- Verify model is loading correctly
- Consider model optimization

## Scaling

### Free Tier Limits

- Bandwidth: 100GB/month
- Function executions: 100GB-hours/month
- KV storage: 256MB (if using Upstash)
- KV requests: 10K reads/day

### When to Upgrade

- Exceeding bandwidth limits
- Need more KV storage
- Need faster builds
- Need custom domains

Pro Plan: $20/month
- Unlimited bandwidth
- More KV storage
- Faster builds
- Custom domains

## Deployment Checklist

Before deploying:

- [ ] Code pushed to GitHub
- [ ] All dependencies in `package.json`
- [ ] Environment variables ready (optional)
- [ ] Model files ready (optional)
- [ ] `.env.local` not committed (in `.gitignore`)
- [ ] `next.config.js` configured
- [ ] `vercel.json` exists (for cron jobs)

After deploying:

- [ ] Site loads correctly
- [ ] Real-time streaming works
- [ ] Predictions working
- [ ] Metrics endpoint accessible
- [ ] No console errors
- [ ] Mobile responsive

## Success!

Your Crypto Micro-Terminal is now live on Vercel!

**Share your deployment:**
- Live URL: `https://your-app.vercel.app`
- GitHub repo: `https://github.com/your-username/your-repo`

**For recruiters:**
- Production deployment
- Real-time predictions
- Edge inference
- Cloud infrastructure
- Live demo ready

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Edge Functions](https://vercel.com/docs/functions/edge-functions)

## Need Help?

- Check Vercel dashboard logs
- Review build output
- Test locally first: `npm run build && npm start`
- Check [Vercel Community](https://github.com/vercel/vercel/discussions)
