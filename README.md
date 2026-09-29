# Missio — Personal Execution & Mission System

Goal → Personalized Plan → Ready-to-Execute Mission → Action → Verification → Adaptive Replanning.

## Run locally

Requires Node 18+.

```bash
npm run setup          # installs deps, seeds content library, builds client
cp server/.env.example server/.env   # set JWT_SECRET
npm start              # http://localhost:4000 (API + built client)
```

Development with hot reload (two terminals):

```bash
npm run dev:server     # API on :4000
npm run dev:client     # Vite on :5173, proxies /api to :4000
```

End-to-end browser test (needs Playwright + Chromium; app running on :5173 or :4000):

```bash
cd e2e && BASE_URL=http://localhost:4000 PW_MODULE=playwright node journey.mjs
```

## What's built

- Auth (JWT + bcrypt), onboarding (DSA / fitness goals, level, daily time budget)
- Curated library: 44 DSA problems (11 topics), 25 bodyweight exercises (5 topics)
- Mission generator: deterministic selection + optional AI phrasing (`ANTHROPIC_API_KEY`), always with a deterministic fallback
- Ideal / Minimum / Rescue variants precomputed per mission, instant switching
- Adaptive preflight: low sleep or a skipped yesterday defaults to Minimum; low water adds a hydration mission; topics rotate; difficulty bumps/rolls back on outcomes
- Execution Mode: one step at a time, timer, resource link, finish with "Nailed it / Struggled"
- Daily check-in and a factual Progress page

## Known limitations / decisions

- **Database:** the sandbox this was built in couldn't reach MongoDB, so persistence is an embedded JSON file store (`server/data/db.json`) behind repository modules in `server/src/repositories/`. Moving to Mongoose + Atlas means reimplementing those six small modules with the same function signatures. Not suitable for multi-instance production until then.
- Not built yet (per plan): calendar sync, web push, browser extension, wearable sync, gamification, DBMS/OS/CN/OOP/SQL/HR content libraries.
- PWA has a manifest only (no service worker or icons yet).
- Dates use UTC (`toISOString`), so "today" can roll over at a non-midnight local time.
