# Deployment Guide

This guide covers deploying ONE: INSEPARABLE to various platforms.

---

## 📦 Step 1: Push to GitHub

### Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `one-inseparable` (or your preference)
3. Keep it **Private** (recommended)
4. Don't initialize with README (we have one)

### Push Code

```bash
# Initialize git (if not already)
cd one_app
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ONE Inseparable MVP"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/one-inseparable.git

# Push
git branch -M main
git push -u origin main
```

---

## 🚀 Option A: Deploy to Replit

**Best for:** Quick testing, prototyping, demos

### Step 1: Import from GitHub

1. Go to [replit.com](https://replit.com) and sign in
2. Click **Create Repl** → **Import from GitHub**
3. Paste your repository URL
4. Select **Node.js** as the language

### Step 2: Configure Replit Secrets

In Replit, go to **Secrets** (🔒 icon in sidebar) and add:

| Secret Name | Value | Required |
|-------------|-------|----------|
| `DATABASE_URL` | `file:./dev.db` | ✅ |
| `JWT_SECRET` | Generate: `openssl rand -base64 64` | ✅ |
| `JWT_REFRESH_SECRET` | Generate: `openssl rand -base64 64` | ✅ |
| `CORS_ORIGIN` | Your Replit URL (e.g., `https://one-app.yourusername.repl.co`) | ✅ |
| `WEB_BASE_URL` | Same as CORS_ORIGIN | ✅ |
| `STRIPE_SECRET_KEY` | From Stripe Dashboard | Optional |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard | Optional |
| `RESEND_API_KEY` | From Resend Dashboard | Optional |
| `CRON_SECRET` | Generate: `openssl rand -base64 32` | Optional |

### Step 3: Configure Replit

Create/edit `.replit` file:

```toml
run = "npm install && npm run db:generate && npm run db:migrate && npm run db:seed && npm run dev"

[nix]
channel = "stable-23_11"

[env]
NODE_ENV = "development"

[[ports]]
localPort = 3000
externalPort = 80

[[ports]]
localPort = 4000
externalPort = 4000
```

### Step 4: Run

Click the **Run** button. First run will:
1. Install dependencies
2. Generate Prisma client
3. Run database migrations
4. Seed data
5. Start dev servers

---

## 🏭 Option B: Production Deployment (Vercel + Railway)

**Best for:** Production, scalability, reliability

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vercel         │────▶│  Railway        │────▶│  Railway        │
│  (Next.js Web)  │     │  (Express API)  │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Step 1: Deploy Database (Railway)

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Provision PostgreSQL**
3. Once created, click on the PostgreSQL service
4. Go to **Connect** tab → copy **DATABASE_URL**

### Step 2: Deploy Server (Railway)

1. In the same Railway project, click **New** → **GitHub Repo**
2. Select your repository
3. Configure:
   - **Root Directory:** `apps/server`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm run start`

4. Add **Environment Variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (from PostgreSQL service) |
| `JWT_SECRET` | (generate secure random string) |
| `JWT_REFRESH_SECRET` | (generate secure random string) |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `CORS_ORIGIN` | Your Vercel URL (add after deploying) |
| `WEB_BASE_URL` | Your Vercel URL |
| `STRIPE_SECRET_KEY` | (from Stripe) |
| `STRIPE_WEBHOOK_SECRET` | (from Stripe) |
| `RESEND_API_KEY` | (from Resend) |
| `CRON_SECRET` | (generate secure random string) |

5. After deployment, note your Railway API URL (e.g., `https://one-api.up.railway.app`)

### Step 3: Deploy Web (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project** → **Import Git Repository**
3. Select your repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** (default)
   - **Output Directory:** (default)

5. Add **Environment Variables:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway API URL |
| `NEXTAUTH_SECRET` | (generate secure random string) |
| `NEXTAUTH_URL` | Your Vercel URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (from Stripe) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL |

6. Deploy!

### Step 4: Update CORS

After deploying to Vercel, go back to Railway and update `CORS_ORIGIN` to your Vercel URL.

### Step 5: Run Database Seed

SSH or use Railway's shell:

```bash
npx prisma db seed
```

---

## 🌐 Option C: Vercel + Neon (Serverless)

**Best for:** Serverless-first, cost-effective

### Step 1: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the **Connection String** (pooled recommended)

### Step 2: Deploy to Vercel

Follow the same steps as Option B, but use the Neon connection string for `DATABASE_URL`.

---

## ⏰ Setting Up Cron Jobs

### Using cron-job.org (Free)

1. Go to [cron-job.org](https://cron-job.org) and sign up
2. Create new cron jobs:

#### Daily Anchor Reminders
- **URL:** `https://your-api.com/api/cron/daily-reminders`
- **Schedule:** `0 7 * * *` (7:00 AM daily)
- **Request Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

#### Streak Check
- **URL:** `https://your-api.com/api/cron/streak-check`
- **Schedule:** `0 9 * * *` (9:00 AM daily)
- **Request Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

### Using Railway Cron (Alternative)

Railway supports cron jobs natively. Add to your deployment:

```bash
railway cron add "0 7 * * *" "curl -X POST -H 'Authorization: Bearer $CRON_SECRET' $RAILWAY_PUBLIC_DOMAIN/api/cron/daily-reminders"
```

---

## 🔧 Stripe Webhook Setup

### For Production

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL:** `https://your-api.com/api/billing/webhook`
4. **Events to listen:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy **Signing secret** to `STRIPE_WEBHOOK_SECRET`

### For Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4000/api/billing/webhook
```

---

## 🔍 Troubleshooting

### Common Issues

#### "Prisma Client not found"
```bash
npm run db:generate
```

#### "Database connection failed"
- Check `DATABASE_URL` format
- For PostgreSQL: `postgresql://user:pass@host:5432/dbname`
- For SQLite: `file:./dev.db`

#### "CORS errors"
- Ensure `CORS_ORIGIN` includes your frontend URL
- Multiple origins: `https://app.com,https://www.app.com`

#### "JWT errors in production"
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are the same across restarts
- Don't use default values in production

#### "Stripe webhook signature error"
- Verify `STRIPE_WEBHOOK_SECRET` matches your endpoint
- For local testing, use the CLI's temporary secret

---

## 📊 Monitoring

### Recommended Tools

- **Vercel Analytics** — Built-in for Vercel deployments
- **Railway Observability** — Built-in for Railway
- **Sentry** — Error tracking (add `SENTRY_DSN` env var)
- **LogDNA/Papertrail** — Log aggregation

---

## 🔄 CI/CD

The repository includes GitHub Actions workflow (`.github/workflows/ci.yml`):

- Runs on push to `main` and pull requests
- Installs dependencies
- Runs TypeScript checks
- Runs linting
- Generates Prisma client
- Builds all apps

To enable deployment automation, add deployment steps or use platform-specific integrations (Vercel/Railway both support GitHub auto-deploy).

---

## 📝 Environment Variables Reference

### Server (`apps/server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Database connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `PORT` | ❌ | Server port (default: 4000) |
| `NODE_ENV` | ❌ | Environment (development/production) |
| `CORS_ORIGIN` | ❌ | Allowed origins (comma-separated) |
| `WEB_BASE_URL` | ❌ | Frontend URL for links |
| `STRIPE_SECRET_KEY` | ❌ | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | ❌ | Stripe price ID for subscription |
| `RESEND_API_KEY` | ❌ | Resend email API key |
| `EMAIL_FROM` | ❌ | Sender email address |
| `EMAIL_REPLY_TO` | ❌ | Reply-to email address |
| `CRON_SECRET` | ❌ | Secret for authenticating cron requests |

### Web (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js secret |
| `NEXTAUTH_URL` | ✅ | Application URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | ❌ | Application URL for links |
| `NEXT_PUBLIC_ENABLE_FAITH_MODE` | ❌ | Enable faith mode (default: true) |

---

**Need help?** Open an issue on GitHub or email support@oneinseparable.app
