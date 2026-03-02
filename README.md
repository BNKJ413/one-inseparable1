# ONE: INSEPARABLE 💍

> A faith-centered marriage app helping couples strengthen their bond through daily connection anchors, Scripture, and intentional action.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://typescriptlang.org)

---

## 📖 Overview

**ONE: INSEPARABLE** is a mobile-first couples app featuring:

- **Faith Mode** (ON by default, optional) — Scripture-based daily anchors
- **Daily Anchors** — 3–7 minute intentional connection moments
- **Scripture Vault** — 41 curated marriage scriptures with action prompts
- **Connect Ideas** — 58 action ideas across 5 love languages
- **Streaks & Rewards** — Gamification to encourage consistency
- **Subscription & Donations** — Stripe billing integration

### Architecture

```
one_app/
├── apps/
│   ├── web/          # Next.js 14 PWA (mobile-first)
│   ├── server/       # Express API + Prisma ORM
│   └── mobile/       # Expo React Native (scaffold)
├── docs/             # Design documents
└── scripts/          # Utility scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** or **pnpm**
- (Optional) PostgreSQL for production

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/one-inseparable.git
cd one-inseparable
npm install
```

### 2. Environment Setup

```bash
# Server environment
cp apps/server/.env.example apps/server/.env

# Web environment
cp apps/web/.env.example apps/web/.env.local
```

**Minimum required variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite (`file:./dev.db`) or PostgreSQL connection |
| `JWT_SECRET` | Secret for signing access tokens (32+ chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (32+ chars) |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000`) |

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with 41 scriptures + 58 action ideas
npm run db:seed
```

### 4. Run Locally

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API Server | http://localhost:4000 |
| Health Check | http://localhost:4000/health |

---

## 📁 Project Structure

```
apps/server/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Seeding script
│   └── seed_data/           # JSON seed data
├── src/
│   ├── index.ts             # Main Express app
│   ├── routes/
│   │   └── cron.routes.ts   # Cron job endpoints
│   ├── services/
│   │   └── email.service.ts # Resend email integration
│   └── templates/           # Email templates

apps/web/
├── app/
│   ├── page.tsx             # Landing page
│   ├── today/               # Daily anchor dashboard
│   ├── connect/             # Action ideas
│   ├── scripture/           # Scripture vault
│   ├── settings/            # User preferences
│   ├── onboarding/          # New user flow
│   └── components/          # Reusable UI
├── contexts/
│   └── AuthContext.tsx      # Auth state management
└── lib/
    └── api.ts               # API client
```

---

## 🔒 Security Features

- **bcrypt** password hashing (12 salt rounds)
- **JWT** with access/refresh token rotation
- **Rate limiting** on auth endpoints (10 req/15min)
- **Input validation** with Zod schemas
- **CORS** configuration for allowed origins
- **Webhook signature** verification for Stripe

---

## 💳 Stripe Integration

### Setup

1. Create products/prices in [Stripe Dashboard](https://dashboard.stripe.com)
2. Add to `apps/server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_MONTHLY=price_...
   ```

### Webhook Endpoint

```
POST /api/billing/webhook
```

Configure this URL in Stripe Dashboard → Webhooks.

---

## 📧 Email Notifications (Resend)

### Setup

1. Get API key from [Resend](https://resend.com/api-keys)
2. Configure in `apps/server/.env`:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=ONE <hello@yourdomain.com>
   EMAIL_REPLY_TO=support@yourdomain.com
   ```

### Available Emails

- Welcome email on signup
- Daily anchor reminders
- Partner pairing notifications
- Streak milestone celebrations
- Password reset

---

## ⏰ Cron Jobs

Endpoints for external schedulers (e.g., cron-job.org):

| Endpoint | Purpose | Recommended Schedule |
|----------|---------|---------------------|
| `POST /api/cron/daily-reminders` | Send morning anchor reminders | 7:00 AM daily |
| `POST /api/cron/streak-check` | Check and celebrate streaks | 9:00 AM daily |

**Authentication:** Include `Authorization: Bearer YOUR_CRON_SECRET` header.

---

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides:

- **Replit** — Quick deployment with GitHub import
- **Vercel + Railway** — Production-grade deployment
- **Vercel + Neon** — Serverless PostgreSQL option

---

## 📝 API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Revoke refresh token |
| `/api/auth/me` | GET | Get current user |

### Core Features

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/anchors/today` | GET | Get daily anchor |
| `/api/anchors/complete` | POST | Mark anchor complete |
| `/api/scripture/list` | GET | List scriptures |
| `/api/scripture/search` | GET | Search scriptures |
| `/api/actions/list` | GET | List action ideas |
| `/api/couple/create` | POST | Create couple |
| `/api/couple/join` | POST | Join with invite code |

---

## 🎨 Content Library

### Scripture Vault (41 entries)
Categories: Romance, Unity, Communication, Forgiveness, Guard Mind, Patience, Sacrifice, Trust, Intimacy, Conflict Resolution, Spiritual Growth, Gratitude, Commitment, Purity

### Action Ideas (58 entries)
- **Love Languages:** Words, Quality Time, Touch, Acts of Service, Gifts
- **Time Options:** 2min, 7min, 20min
- **Modes:** Faith, Emotional, Physical, Actionable

---

## 🧪 Development

### Commands

```bash
npm run dev          # Start all apps in dev mode
npm run build        # Build all apps
npm run lint         # Run linting
npm run typecheck    # TypeScript check

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, CSS Modules
- **Backend:** Express.js, Prisma ORM, TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** JWT with bcrypt
- **Email:** Resend
- **Payments:** Stripe

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/one-inseparable/issues)
- **Email:** support@oneinseparable.app

---

**Built with ❤️ for couples pursuing oneness.**
