# Ledger

A private budget & expense tracker with custom categories, manual entry, and an AI capture button
that reads plain-text descriptions or photos of receipts, bank statements, and passbook pages.
Each person who signs up gets their own account and their own data.

## Stack
- Next.js 14 (App Router)
- PostgreSQL + Prisma
- NextAuth (email + password)
- Anthropic API (called server-side — your API key never reaches the browser)

## 1. Get the code onto GitHub
1. Create a new empty repository on [github.com](https://github.com/new).
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

## 2. Create a free Postgres database
Easiest option: [neon.tech](https://neon.tech) → New Project → copy the connection string
(it looks like `postgresql://user:pass@host/db?sslmode=require`).
Vercel Postgres (Storage tab, inside your Vercel project) works the same way if you'd rather stay in one dashboard.

## 3. Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Before the first deploy, add these Environment Variables (Project Settings → Environment Variables):
   - `DATABASE_URL` — the connection string from step 2
   - `NEXTAUTH_SECRET` — any random string (generate one with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your deployed URL, e.g. `https://ledger-yourname.vercel.app` (you can add this after the first deploy once you know the URL, then redeploy)
   - `ANTHROPIC_API_KEY` — your key from [console.anthropic.com](https://console.anthropic.com) → API Keys
3. Deploy.
4. Push the database schema once, from your machine (with `DATABASE_URL` set the same way, e.g. in a local `.env`):
   ```bash
   npm install
   npx prisma db push
   ```
   This creates the `User`, `Category`, and `Transaction` tables in your new database. You only need to do this once (and again any time you change `prisma/schema.prisma`).
5. Open your Vercel URL, sign up for an account, and try it out.

## 4. Add it to your iPhone home screen
Open your Vercel URL in **Safari** → Share icon → **Add to Home Screen**. It'll launch full-screen like a native app. Because your data lives in your own database now (not the browser), it's the same account and same data whether you open it from your home screen icon, another phone, or a laptop.

## Notes on cost & sharing publicly
- The AI capture button uses **your** `ANTHROPIC_API_KEY` for every user of the app, not each person's own key. That's fine for you and a few friends/family, but if this ever gets real public signups, put a per-user or daily rate limit on `/api/ai/parse` so one heavy user can't run up your API bill.
- `npx prisma studio` (run locally, pointed at your `DATABASE_URL`) gives you a simple table browser if you ever want to peek at the raw data.

## Local development
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY
npx prisma db push
npm run dev
```

## Later: App Store
This same codebase can be wrapped for iOS distribution (e.g. with Capacitor) once you're happy with it on the web — that's a good next phase after you've used it for a bit and ironed out anything you want changed. Happy to walk through that when you're ready.
