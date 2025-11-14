# Deployment Checklist ✅

Use this checklist before deploying to Vercel.

## Pre-Deployment

- [ ] All code committed to Git
- [ ] Code pushed to GitHub
- [ ] `package.json` has all dependencies
- [ ] `.env.local` is in `.gitignore` (not committed)
- [ ] No hardcoded secrets in code
- [ ] `next.config.js` configured
- [ ] `vercel.json` exists (for cron jobs)

## Vercel Setup

- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Vercel KV database created
- [ ] KV credentials copied (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)

## Environment Variables

- [ ] `KV_REST_API_URL` set in Vercel
- [ ] `KV_REST_API_TOKEN` set in Vercel
- [ ] Variables set for Production, Preview, and Development

## Model Files (Optional)

- [ ] Model trained (Kaggle or local)
- [ ] `public/model/` folder exists
- [ ] `public/scaler-params.json` exists
- [ ] Model files committed to Git (or will add after deployment)

## Testing

- [ ] `npm run build` works locally
- [ ] `npm start` works locally
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] API endpoints work locally

## Deployment

- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Deployment triggered
- [ ] Build completed successfully
- [ ] Site is live and accessible

## Post-Deployment

- [ ] Site loads correctly
- [ ] Real-time streaming works (`/api/stream`)
- [ ] Predictions work (`/api/predict`)
- [ ] Metrics accessible (`/api/metrics`)
- [ ] Chart displays correctly
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] Performance is acceptable

## Documentation

- [ ] README.md updated
- [ ] Deployment guide created
- [ ] Live URL documented
- [ ] GitHub repo is public (or shared with team)

## 🎉 Ready to Share!

- [ ] Live URL: `https://your-app.vercel.app`
- [ ] GitHub repo: `https://github.com/your-username/your-repo`
- [ ] Demo ready for recruiters!

---

**Quick Reference:**
- Full guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Quick start: [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)

