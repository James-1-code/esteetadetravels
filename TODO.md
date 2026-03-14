# Vercel Deployment Plan

**Frontend (app/) - Vercel-ready**:
- [ ] 1. vercel login
- [ ] 2. cd app && vercel --prod
- [ ] 3. Update app/.env VITE_API_URL=your-backend.vercel.app/api

**Backend (backend/) - Serverless**:
- [ ] 1. Create backend/vercel.json (below)
- [ ] 2. cd backend && vercel --prod
- [ ] 3. Set env vars (PG URL, JWT secret, etc.)

**Backend vercel.json**:
```
{
  "version": 2,
  "builds": [
    {"src": "src/index.js", "use": "@vercel/node"}
  ],
  "routes": [
    {"src": "/api/(.*)", "dest": "src/index.js"}
  ]
}
```

Production URL from Vercel → update frontend .env → rebuild frontend.

Backend env needed: DB_URL, JWT_SECRET, etc. List backend/.env vars?
