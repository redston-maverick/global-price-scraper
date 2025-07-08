# Deploy to Vercel Free Tier 🚀

This guide will help you deploy your Global Price Scraper to Vercel's free tier.

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)

## Step 1: Prepare Your Repository

1. **Initialize git** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: Global Price Scraper"
```

2. **Create GitHub repository**:
   - Go to [GitHub.com](https://github.com) → New Repository
   - Name it `global-price-scraper`
   - Make it public (required for free tier)
   - Don't initialize with README (you already have files)

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/global-price-scraper.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Sign up/Login** to [Vercel](https://vercel.com)
2. **Import Project**:
   - Click "New Project"
   - Connect your GitHub account
   - Select your `global-price-scraper` repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. **Environment Variables** (Optional):
   - Add any custom variables if needed
   - The app will work with defaults

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for deployment

### Option B: Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```
   - Follow the prompts
   - Choose default settings
   - Wait for deployment

## Step 3: Test Your Deployment

Once deployed, you'll get a URL like: `https://your-app-name.vercel.app`

### Test API Endpoints:

1. **Homepage**: `https://your-app-name.vercel.app`
2. **Health Check**: `https://your-app-name.vercel.app/api/health`
3. **Price Search**:
```bash
curl -X POST https://your-app-name.vercel.app/api/prices/search \
  -H "Content-Type: application/json" \
  -d '{"country": "GB", "query": "Samsung Galaxy S24"}'
```

## Free Tier Optimizations Applied

✅ **10-second timeout limit** - Functions auto-terminate  
✅ **Puppeteer disabled** - Uses lightweight Cheerio only  
✅ **Mock data enabled** - For demonstration purposes  
✅ **Reduced request timeouts** - 5 seconds max  
✅ **Smaller bundle size** - Puppeteer as optional dependency  

## Important Notes

- **Mock Data**: Real scraping is limited due to anti-bot protection, so mock data demonstrates the API structure
- **Rate Limiting**: Vercel free tier has built-in limits
- **Cold Starts**: First request may be slower (serverless function startup)
- **Execution Time**: Max 10 seconds per request on free tier

## Troubleshooting

### Common Issues:

1. **Build fails**:
   - Check all files are committed to GitHub
   - Verify package.json syntax

2. **Function timeout**:
   - This is expected - free tier has 10s limit
   - App gracefully falls back to mock data

3. **Environment variables**:
   - Add them in Vercel dashboard under "Settings" → "Environment Variables"

### Support

- 📧 Check Vercel dashboard for build logs
- 🐛 Monitor function logs in Vercel dashboard
- 🔄 Redeploy from Vercel dashboard if needed

## Custom Domain (Optional)

On Vercel free tier, you can add a custom domain:
1. Go to Project → Settings → Domains
2. Add your domain
3. Configure DNS as instructed

## Success! 🎉

Your Global Price Scraper is now live on Vercel's free tier, optimized for serverless deployment with automatic scaling and global CDN distribution. 