# 🚀 Backend Vercel Deployment Guide (Esteetade Travels API)

## Prerequisites (5 mins)
1. **Vercel Account**: [vercel.com/signup](https://vercel.com/signup) (GitHub login recommended)
2. **Neon Postgres**: Already set up (DATABASE_URL confirmed working locally)
3. **Paystack Account**: [paystack.com](https://paystack.com) → **LIVE** API keys
4. **Gmail App Password**: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
5. **Vercel CLI**: `npm i -g vercel`

## Step 1: Install & Login (Terminal)
```bash
npm i -g vercel
vercel login  # Browser → GitHub/Email
```

## Step 2: Initial Deploy (backend/)
```bash
cd backend
vercel --prod
```
**Prompts:**
```
? Set up and deploy “C:\Users\USER\Desktop\Do not Open\SaaS Backend Build\backend”? [Y/n] → Y
? Which scope? → Your account  
? Link to existing project? [y/N] → N
? What’s your project's name? → esteetade-backend (or custom)
? In which directory is your code located? → ./ (default)
? Want to override the build settings? [y/N] → N  
✅ Deployed! Note URL: https://esteetade-backend-xxx.vercel.app
```

## Step 3: Configure Environment Variables
**Vercel Dashboard**: vercel.com → esteetade-backend → Settings → Environment Variables

| Environment Variable | Value | Source |
|---------------------|-------|--------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` | Neon Dashboard → Connect |
| `JWT_SECRET` | `openssl rand -hex 32` (run command) | Terminal |
| `PAYSTACK_SECRET_KEY` | `sk_live_xxxxxxxx` | Paystack → Settings → API Keys (LIVE) |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxxxxx` | Paystack → Settings → API Keys (LIVE) |
| `SMTP_HOST` | `smtp.gmail.com` | - |
| `SMTP_PORT` | `587` | - |
| `SMTP_USER` | `yourapp@gmail.com` | Gmail |
| `SMTP_PASS` | `abcd efgh ijkl mnop` | Gmail App Passwords |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your frontend Vercel URL |

**Add ALL vars → Save → Redeploy** (Deployments → Redploy).

## Step 4: Verify Backend
```bash
BACKEND_URL=https://esteetade-backend-xxx.vercel.app
curl $BACKEND_URL/health
# → {\"success\":true,\"message\":\"Server is running\"}
```

Test login:
```bash
curl -X POST $BACKEND_URL/api/auth/login \\
  -H \"Content-Type: application/json\" \\
  -d '{\"email\":\"test@example.com\",\"password\":\"password\"}'
```

## Step 5: Connect Frontend
**Frontend Vercel Dashboard** → Settings → Environment Variables:
```
VITE_API_URL=https://esteetade-backend-xxx.vercel.app
```
**Redeploy frontend.**

## Step 6: Final Tests
✅ Landing page loads
✅ Register new user → Email sent (check spam)
✅ Login → Dashboard  
✅ Create application → Backend processes
✅ File uploads → Wasabi S3

## Troubleshooting
| Error | Fix |
|-------|-----|
| DB Connection Failed | DATABASE_URL format + sslmode=require |
| Invalid JWT | JWT_SECRET set + redeploy |
| Paystack 401 | LIVE keys (not test) |
| CORS Error | FRONTEND_URL exact match |
| Email not sent | Gmail App Password (16-char) |
| 404 on /api/* | vercel.json routes correct ✅ |

## Updates & CI/CD
```bash
cd backend  # Make changes
vercel --prod  # Auto deploys + new build
```

## Costs (Free Tier)
- Vercel: 100GB bandwidth/mo (ample)
- Neon: 0.5GB storage free
- Paystack: Transaction fees only

**Production ready!** Your SaaS backend scales automatically.

**Your URLs:**
- Frontend: https://your-app.vercel.app
- Backend: https://esteetade-backend-xxx.vercel.app  
- DB: Neon Postgres (serverless)

