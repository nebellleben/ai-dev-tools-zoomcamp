# Cloud Deployment Options

This document outlines various cloud deployment options for the Code Interview Platform.

## Quick Comparison

| Platform | Ease of Use | Cost | WebSocket Support | Docker Support | Best For |
|----------|-------------|------|-------------------|----------------|----------|
| **Railway** | ⭐⭐⭐⭐⭐ | Free tier + $5/mo | ✅ Excellent | ✅ Native | Quick deployment, beginners |
| **Render** | ⭐⭐⭐⭐⭐ | Free tier + $7/mo | ✅ Excellent | ✅ Native | Simple, reliable |
| **Fly.io** | ⭐⭐⭐⭐ | Free tier + pay-per-use | ✅ Excellent | ✅ Native | Global edge deployment |
| **Google Cloud Run** | ⭐⭐⭐ | Pay-per-use | ✅ Supported | ✅ Native | Serverless, auto-scaling |
| **DigitalOcean App Platform** | ⭐⭐⭐⭐ | $5/mo | ✅ Excellent | ✅ Native | Simple, predictable pricing |
| **AWS ECS/Fargate** | ⭐⭐ | Variable | ✅ Excellent | ✅ Native | Enterprise, complex needs |
| **Heroku** | ⭐⭐⭐⭐ | $7/mo+ | ✅ Excellent | ✅ Native | Legacy, familiar |

---

## Recommended Options

### 1. Railway (⭐ Recommended for Quick Start)

**Why Railway:**
- ✅ Easiest deployment (connects to GitHub, auto-deploys)
- ✅ Free tier: $5 credit/month
- ✅ Excellent WebSocket support
- ✅ Native Docker support
- ✅ Automatic HTTPS
- ✅ Built-in database options if needed later

**Pricing:**
- Free: $5 credit/month (enough for small apps)
- Paid: $5/month for 512MB RAM, $10/month for 1GB

**Deployment Steps:**
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Railway auto-detects Dockerfile
4. Deploy!

**Best for:** Quick deployment, beginners, small to medium apps

---

### 2. Render (⭐ Recommended for Simplicity)

**Why Render:**
- ✅ Very simple setup
- ✅ Free tier available (with limitations)
- ✅ Excellent WebSocket support
- ✅ Native Docker support
- ✅ Automatic HTTPS
- ✅ Great documentation

**Pricing:**
- Free: Limited hours/month, spins down after inactivity
- Starter: $7/month (always on, 512MB RAM)
- Standard: $25/month (1GB RAM)

**Deployment Steps:**
1. Connect GitHub repo to Render
2. Select "Web Service"
3. Point to Dockerfile
4. Deploy!

**Best for:** Simple deployments, reliable hosting, good free tier

---

### 3. Fly.io (⭐ Recommended for Global Edge)

**Why Fly.io:**
- ✅ Global edge deployment (low latency worldwide)
- ✅ Free tier: 3 shared VMs
- ✅ Excellent WebSocket support
- ✅ Native Docker support
- ✅ Great for real-time apps

**Pricing:**
- Free: 3 shared VMs (256MB each)
- Paid: ~$2-5/month per VM (depending on size)

**Deployment Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Deploy: `fly deploy`

**Best for:** Global users, edge computing, real-time applications

---

### 4. Google Cloud Run (⭐ Recommended for Serverless)

**Why Cloud Run:**
- ✅ Serverless (pay only when running)
- ✅ Auto-scaling to zero
- ✅ Excellent WebSocket support
- ✅ Native Docker support
- ✅ Generous free tier

**Pricing:**
- Free: 2 million requests/month, 360,000 GB-seconds
- Paid: ~$0.10 per 100k requests, $0.0000025 per GB-second

**Deployment Steps:**
1. Install gcloud CLI
2. Build and push to Google Container Registry
3. Deploy to Cloud Run

**Best for:** Serverless architecture, auto-scaling, cost-effective for variable traffic

---

### 5. DigitalOcean App Platform

**Why DigitalOcean:**
- ✅ Simple, predictable pricing
- ✅ Excellent WebSocket support
- ✅ Native Docker support
- ✅ Good documentation

**Pricing:**
- Basic: $5/month (512MB RAM)
- Professional: $12/month (1GB RAM)

**Deployment Steps:**
1. Connect GitHub repo
2. Select Dockerfile
3. Configure and deploy

**Best for:** Predictable costs, simple deployments

---

## Detailed Deployment Guides

### Option 1: Railway Deployment (Easiest)

#### Prerequisites:
- GitHub account
- Railway account (free at railway.app)

#### Steps:

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Railway account:**
   - Go to https://railway.app
   - Sign up with GitHub

3. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Configure deployment:**
   - Railway auto-detects Dockerfile
   - Set environment variables (optional):
     - `NODE_ENV=production`
     - `PORT=3001` (Railway sets this automatically)
     - `FRONTEND_URL=https://your-app.railway.app`

5. **Deploy:**
   - Railway automatically builds and deploys
   - Get your URL: `https://your-app.railway.app`

6. **Update frontend WebSocket URL:**
   - Update `VITE_WS_URL` in frontend to use Railway URL
   - Or rebuild frontend with production URL

**Railway automatically provides:**
- HTTPS certificate
- Public URL
- Auto-deploy on git push
- Logs and metrics

---

### Option 2: Render Deployment

#### Prerequisites:
- GitHub account
- Render account (free at render.com)

#### Steps:

1. **Push code to GitHub** (same as Railway)

2. **Create Render account:**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo

4. **Configure:**
   - **Name:** code-interview-platform
   - **Environment:** Docker
   - **Dockerfile Path:** `Dockerfile`
   - **Build Command:** (auto-detected)
   - **Start Command:** (auto-detected)

5. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-app.onrender.com
   ```

6. **Deploy:**
   - Click "Create Web Service"
   - Render builds and deploys
   - Get URL: `https://your-app.onrender.com`

**Note:** Free tier spins down after 15 minutes of inactivity. Upgrade to Starter ($7/mo) for always-on.

---

### Option 3: Fly.io Deployment

#### Prerequisites:
- Fly.io account (free at fly.io)
- Fly CLI installed

#### Steps:

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Initialize Fly app:**
   ```bash
   cd 02-end-to-end
   fly launch
   ```
   - Follow prompts to create app
   - Select region (closest to you)

4. **Deploy:**
   ```bash
   fly deploy
   ```

5. **Get URL:**
   ```bash
   fly open
   ```

**Fly.io features:**
- Global edge deployment
- Automatic HTTPS
- Built-in metrics

---

### Option 4: Google Cloud Run

#### Prerequisites:
- Google Cloud account
- gcloud CLI installed
- Billing enabled (free tier available)

#### Steps:

1. **Install gcloud CLI:**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Login and set project:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

4. **Build and deploy:**
   ```bash
   cd 02-end-to-end
   gcloud run deploy code-interview-platform \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3001
   ```

5. **Get URL:**
   - Cloud Run provides URL automatically
   - Format: `https://your-app-xxx-uc.a.run.app`

---

## Environment Variables

For all platforms, you may need to set:

```bash
NODE_ENV=production
PORT=3001  # (or platform-specific port)
FRONTEND_URL=https://your-deployed-url.com
```

## Post-Deployment Checklist

- [ ] Verify application is accessible
- [ ] Test WebSocket connections
- [ ] Test code execution (JavaScript and Python)
- [ ] Verify HTTPS is working
- [ ] Check logs for any errors
- [ ] Test room creation and sharing
- [ ] Verify real-time collaboration works

## Cost Comparison (Approximate Monthly)

| Platform | Free Tier | Paid Tier (Small App) |
|----------|-----------|----------------------|
| Railway | $5 credit | $5-10 |
| Render | Limited | $7 |
| Fly.io | 3 VMs | $2-5 |
| Cloud Run | Generous | $0-5 (pay-per-use) |
| DigitalOcean | None | $5 |
| AWS ECS | None | $10-20 |
| Heroku | None | $7+ |

## Recommendation

**For beginners:** Start with **Railway** or **Render** - easiest setup
**For global users:** Use **Fly.io** - edge deployment
**For cost optimization:** Use **Google Cloud Run** - pay-per-use
**For simplicity:** Use **DigitalOcean App Platform** - predictable pricing

## Next Steps

1. Choose a platform based on your needs
2. Follow the deployment guide for that platform
3. Update frontend WebSocket URL if needed
4. Test the deployed application
5. Share your deployed URL!

---

## Troubleshooting

### WebSocket Issues
- Ensure platform supports WebSockets
- Check CORS settings
- Verify WebSocket URL uses `wss://` (secure) in production

### Build Failures
- Check Dockerfile syntax
- Verify all dependencies are in package.json
- Check build logs on platform

### Port Issues
- Some platforms set PORT automatically (Railway, Render)
- Update Dockerfile CMD if needed
- Check platform documentation

