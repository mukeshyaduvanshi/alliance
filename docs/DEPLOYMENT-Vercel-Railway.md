# Deployment Guide — Vercel + Railway

Is repo (monorepo) me 6 apps hain:

| App | Type | Deploy Platform |
|-----|------|-----------------|
| `apps/admin` | Next.js frontend | Vercel |
| `apps/brand` | Next.js frontend | Vercel |
| `apps/vendor` | Next.js frontend | Vercel |
| `apps/manager` | Next.js frontend | Vercel |
| `apps/developer` | Next.js frontend | Vercel |
| `apps/backend` | NestJS API | Railway |

---

## 1. Backend — Railway

### 1.1 Service create karo

1. [Railway.app](https://railway.app) par login karo.
2. **New Project** → **Deploy from GitHub repo** → apna repo select karo.
3. Railway root `Dockerfile` ko automatically detect karega (project ka root `Dockerfile` backend ke liye hai).
   - Agar auto-detect na ho: **Settings → Build → Dockerfile Path** me `/Dockerfile` set karo.
4. Ek **PostgreSQL** service bhi add karo (backup/DB ke liye):
   - `New` → `Database` → `PostgreSQL`.
   - Iska `DATABASE_URL` yad rakhna — backend ke env me dalna hai.

### 1.2 Environment Variables

Backend service ke **Variables** tab me ye add karo:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=<Railway Postgres ka URL>
DIRECT_URL=<same as DATABASE_URL>
JWT_SECRET=<strong random secret>
DEFAULT_TENANT_ID=<apna tenant id>
REDIS_URL=<Upstash/Redis URL>
RESEND_API_KEY=<Resend API key>
RESEND_EMAIL_URL="Acme <onboarding@resend.dev>"
CORS_ORIGINS=https://admin.your-domain.com,https://brand.your-domain.com,...
```

> **Important:** Railway environment variables me `DATABASE_URL` production wala daalo. Dockerfile me jo dummy URL hai wo sirf build time (`prisma generate`) ke liye hai.

### 1.3 Migrations (pehli baar)

Railway par pehli baar DB tables banane ke liye migration chahiye. Do tarike:

- **Option A — Railway Dashboard (recommended):** Backend service par ek **Start Command** me migration add karo:
  ```
  npx prisma migrate deploy && node apps/backend/dist/main.js
  ```
  (prisma binary packages/database ke `node_modules` me hai, isliye cwd `/app/packages/database` se run karo — niche see 1.4)

- **Option B — Local se migrate:** Apne machine par:
  ```bash
  DATABASE_URL=<prod-url> pnpm --filter @database/database migrate:deploy
  ```

### 1.4 Railway Start Command (recommended)

Railway **Settings → Deploy** me:

- **Root Directory:** (empty / repo root)
- **Start Command:**
  ```bash
  cd /app/packages/database && npx prisma migrate deploy && cd /app && node apps/backend/dist/main.js
  ```

### 1.5 Domain

1. Backend service → **Settings → Networking → Generate Domain**.
2. Milne wala URL ho jayega: `https://backend-production-xxxx.up.railway.app`
3. API base URL hoga: `https://backend-production-xxxx.up.railway.app/api/v1`

---

## 2. Frontend Apps — Vercel

Har frontend app ke liye Vercel par **alag project** banana hoga (monorepo ke karan).

### 2.1 Project create karo (har app ke liye repeat karo)

1. [vercel.com](https://vercel.com) → **Add New Project** → apna GitHub repo import karo.
2. **Root Directory** me app ka folder select karo, e.g.:
   - `apps/admin`
   - `apps/brand`
   - `apps/vendor`
   - `apps/manager`
   - `apps/developer`
3. **Framework Preset:** Next.js (auto detect hoga).
4. **Build & Output Settings** (default chhod do):
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
5. **Environment Variables** (har project me):
   ```env
   NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app/api/v1
   ```
   > Note: Yeh NEXT_PUBLIC_API_URL har frontend app me same backend URL ho sakta hai.

6. **Deploy** dabao.

> **Monorepo ka dhyan:** Vercel ka build `turbo` ke through chalta hai (root `package.json` me `build: turbo build`). Har app apne `apps/*` folder se build hota hai — isliye koi conflict nahi hoga.

### 2.2 Domains

Har project → **Settings → Domains** → apna domain add karo:
- `admin.your-domain.com` → admin app
- `brand.your-domain.com` → brand app
- `vendor.your-domain.com` → vendor app
- `manager.your-domain.com` → manager app
- `developer.your-domain.com` → developer app

---

## 3. Deploy Hooks (Nightly Deploy ke liye)

Nightly workflow (`.github/workflows/deploy-nightly.yml`) deploy hooks ko curl karta hai. Har app ke liye ek hook banana hoga.

1. Vercel → app project → **Settings → Git → Deploy Hooks**.
2. Naam do (e.g. `nightly-admin`) aur **Create Hook** dabao.
3. Milne wala URL copy karo — ye kuch aisa hoga:
   `https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx`

### 3.1 GitHub Secrets

GitHub repo → **Settings → Secrets and variables → Actions** me ye secrets add karo:

```
VERCEL_DEPLOY_HOOK_ADMIN      = <admin ka hook URL>
VERCEL_DEPLOY_HOOK_BRAND      = <brand ka hook URL>
VERCEL_DEPLOY_HOOK_VENDOR     = <vendor ka hook URL>
VERCEL_DEPLOY_HOOK_MANAGER    = <manager ka hook URL>
VERCEL_DEPLOY_HOOK_DEVELOPER  = <developer ka hook URL>
```

Nightly workflow roj 12:00 AM (IST) par in hooks ko trigger karega.

---

## 4. CI Workflow

`.github/workflows/ci.yml` push/PR par **Lint** aur **Build** check karta hai:

- `pnpm install --frozen-lockfile`
- Prisma client generate
- `pnpm build` (turbo build)

CI me koi action nahi chahiye — bas GitHub repo se chal jata hai.

---

## 5. Railway + Vercel ke beech connection

1. Railway backend ka URL lo (section 1.5).
2. Vercel har app ke `NEXT_PUBLIC_API_URL` me wo URL set karo (section 2.1).
3. Backend me `CORS_ORIGINS` me apne Vercel domains list karo taaki browser requests allow hon.

---

## 6. Quick Checklist

- [ ] Railway par backend deployed (Dockerfile se)
- [ ] Railway Postgres create aur `DATABASE_URL` set
- [ ] `prisma migrate deploy` ek baar chala diya
- [ ] Railway domain generate kiya
- [ ] Vercel par 5 projects banaye (admin, brand, vendor, manager, developer)
- [ ] Har project me `NEXT_PUBLIC_API_URL` set kiya
- [ ] 5 Deploy Hooks banaye aur GitHub secrets me dal diye
- [ ] CI workflow chal raha hai

---

## 7. Problem Fixes

| Problem | Fix |
|---------|-----|
| Backend start nahi ho raha (Prisma error) | `prisma migrate deploy` chalao ya `prisma generate` rebuild karo |
| CORS error browser me | Backend `CORS_ORIGINS` me Vercel domain dalo |
| `@database/database` resolve nahi ho raha | Monorepo me backend sirf Dockerfile wale path se hi deploy karo (sirf apps/backend folder nahi) |
| `ERR_PNPM_META_FETCH_FAIL` / `ERR_INVALID_THIS` (Vercel build me) | Har frontend app ke `package.json` me `"packageManager": "pnpm@11.13.1"` add karo — Vercel use karta hai is field ko pnpm version choose karne ke liye. Vercel ka purana pnpm Node 24 ke `URLSearchParams` API se crash karta hai. Har app me `vercel.json` bhi chahiye: `"installCommand": "corepack enable && pnpm install"`. |
| Broken lockfile — "expected a single document in the stream, but found more" | `pnpm-lock.yaml` corrupted/git-merge se 2 YAML documents ho gaye hain. Fix: `pnpm-lock.yaml` delete karke `pnpm install --lockfile-only` se regenerate karo, phir `grep -c "^---" pnpm-lock.yaml` se verify karo ke sirf 1 document hai (0 matches aane chahiye). |
| Nightly workflow fail | Secrets names exact match karo (`VERCEL_DEPLOY_HOOK_ADMIN` etc.) |
