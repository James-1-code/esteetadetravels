# 🚀 Step-by-Step Vercel Deployment (No Mistakes)

## Prerequisites (5 mins)
1. Sign up at [vercel.com](https://vercel.com) → Verify email
2. Create **free Postgres DB** at [neon.tech](https://neon.tech):
   - New project → Copy **DATABASE_URL** (e.g. `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db`)
3. Generate secrets:
   ```
   JWT_SECRET=$(openssl rand -hex 32)  # Copy output
   ```
4. Get Paystack keys: [paystack.com](https://paystack.com) dashboard → Live keys

## Step 1: Install Vercel CLI (1 min)
```
npm i -g vercel
vercel login  # Use GitHub/Email
```

## Step 2: Deploy Backend (5 mins)
```
cd backend
vercel --prod
```
**When prompted:**
- Scope: Your account
- Link to git? No
- Directory? `.` (default)
- Team? Default

**IMMEDIATELY after deploy → Add Env Vars in Vercel Dashboard:**
1. Go to vercel.com → your backend project → Settings → Environment Variables
2. Add ALL from `backend/.env.example`:
   ```
   DATABASE_URL=your-neon-url
   JWT_SECRET=your-secret
   PAYSTACK_SECRET_KEY=sk_live_...
   PAYSTACK_PUBLIC_KEY=pk_live_...
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your@gmail.com
   EMAIL_PASS=app-password
   WASABI_ACCESS_KEY_ID=...
   # etc.
   FRONTEND_URL=will-update-later
   ```
3. **Redeploy**: Git → Deployments → Redeploy (new env vars)

**Test Backend:**
```
BACKEND_URL=https://your-backend-xxx.vercel.app
curl $BACKEND_URL/health  # Should return {"success":true}
```

## Step 3: Deploy Frontend (2 mins)
```
cd ../app
vercel --prod
```
**Prompts:** Same as above.

**Add Frontend Env Var:**
Vercel Dashboard → Settings → Env Vars:
```
VITE_API_URL=https://your-backend-xxx.vercel.app
```
**Redeploy frontend.**

## Step 4: Verify (2 mins)
1. Frontend URL → Visit landing page
2. Backend: `$BACKEND_URL/api/health`
3. Register/login → Create application
4. Admin: Check users/applications (default admin? Seed or manual)

## Troubleshooting
| Issue | Fix |
|-------|-----|
| DB Error | Check DATABASE_URL format, Neon connection |
| 404 API | Env vars not redeployed |
| CORS | FRONTEND_URL=your-frontend.vercel.app |
| Paystack fail | Use LIVE keys, not test |

## Update Production
Future changes: `vercel --prod` auto-deploys.

✅ **Done! Live at your-frontend.vercel.app**

