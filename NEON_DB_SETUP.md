# Neon Postgres Setup (2 mins, Free)

## Step-by-Step:

1. **Go to** [neon.tech/sign-up](https://neon.tech/sign-up) → Sign up (GitHub/Google)

2. **Create Project:**
   ```
   Create a project → Name: esteetade-db → Region: US East (closest/low latency)
   [Create project]
   ```

3. **Get DATABASE_URL:**
   ```
   Dashboard → esteetade-db → Connect → Dashboard tab
   Connection string → Copy FULL URL:
   postgresql://user.rw_xxx:abc123@ep-cool-123.us-east-2.aws.neon.tech/esteetade?sslmode=require
   ```
   **Format MUST include `sslmode=require` at end.**

4. **Paste to Vercel:**
   vercel.com → default-cyan → Settings → Environment Variables → `DATABASE_URL` = your-url → Save → Redeploy

## Verify:
```
curl "https://default-cyan.vercel.app/health"
```
→ `{"success":true,"message":"Server is running"}` ✅

**Free tier:** 0.5GB storage, $10 credits - perfect for startup.

Screenshot guide in DEPLOY_VERCEL.md. Done! 👇
