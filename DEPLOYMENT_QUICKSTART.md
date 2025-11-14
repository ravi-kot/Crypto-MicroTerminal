# Quick Deployment Guide ⚡

**5-minute deployment to Vercel**

## 🚀 Quick Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub

### 3. Create KV Database
- Dashboard → **Storage** → **Create Database** → **KV**
- Copy `KV_REST_API_URL` and `KV_REST_API_TOKEN`

### 4. Import Project
- Dashboard → **Add New** → **Project**
- Select your GitHub repo
- Click **Import**

### 5. Add Environment Variables
- Project → **Settings** → **Environment Variables**
- Add:
  ```
  KV_REST_API_URL = (from step 3)
  KV_REST_API_TOKEN = (from step 3)
  ```

### 6. Deploy!
- Click **Deploy**
- Wait 2-3 minutes
- Click **Visit** when ready

## ✅ Done!

Your app is live at: `https://your-app.vercel.app`

---

**Need detailed instructions?** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

