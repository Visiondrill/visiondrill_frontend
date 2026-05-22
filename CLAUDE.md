# VisionDrill Frontend — Claude Guide

@AGENTS.md

Next.js 16 (App Router) client for the VisionDrill e-learning platform. Companion API lives at `../visiondrill_api` (Laravel 8). This file is the entry point for Claude sessions — read it first.

> **Read AGENTS.md before touching anything.** Next.js 16 has breaking changes from training-data-era Next.js. When in doubt, check `node_modules/next/dist/docs/` rather than guessing.

## Stack

- **Framework:** Next.js `16.2.4` (App Router, file-based routing)
- **React:** `19.2.4`
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/postcss`; theme variables in `src/app/globals.css` (`@theme` directive). Font: Poppins via `next/font/google`.
- **HTTP:** Axios 1.15 wrapper at [src/lib/axios.ts](src/lib/axios.ts)
- **UI primitives:** bespoke Tailwind components + `lucide-react` icons + `clsx`/`tailwind-merge`. No MUI/Chakra/shadcn.
- **DnD:** `@dnd-kit/core` + `@dnd-kit/sortable` (curriculum editor)
- **Video:** `react-player`
- **Toasts:** `react-hot-toast`
- **State:** local `useState` only — **no Redux/Zustand/Context store**. Every page fetches its own data.
- **Tests:** none configured.

## Layout

```text
src/app/                        Next.js App Router pages (file-based)
  page.tsx                      Landing
  login/, register/, logout/    Auth pages
  student/                      Student dashboard (courses, learn, analytics, cohorts, certificates, ...)
  instructor/                   Instructor dashboard (courses, quiz, analytics, ai-generator, ...)
  business/                     Business tier (programs, staff)
  admin/                        Admin panel — currently a stub (work paused here)
  courses/[slug]/               Public course page + learn preview
  drill/[id]/, drill/take/[token]/   Drill-taking flows
  about/, careers/, contact/, privacy/, security/, terms/   Static pages
src/components/                 Shared components (~12 files)
src/lib/                        Axios client + utilities
src/types/                      TS interfaces (curriculum.ts)
public/                         Static assets
legacy/                         Old Vue/Laravel-Mix setup — reference only, not active
next.config.ts                  Allows remote images from localhost:8000 + unsplash.com
```

## Auth flow (Sanctum cookie, NOT bearer token)

The API uses **Laravel Sanctum cookie-based SPA auth**. The FE does not store a token in localStorage despite a misleading `localStorage.removeItem('token')` in the logout page (dead code).

1. Before login/register: `GET /sanctum/csrf-cookie` via `getCsrfCookie()` in [src/lib/axios.ts](src/lib/axios.ts) — seeds the `XSRF-TOKEN` cookie.
2. Axios request interceptor reads `XSRF-TOKEN` from `document.cookie` and attaches it as the `X-XSRF-TOKEN` header on POST/PUT/PATCH/DELETE.
3. All requests use `withCredentials: true` so the session cookie rides along.
4. On `419` (CSRF mismatch): interceptor refreshes via `/sanctum/csrf-cookie` and retries once.
5. On `401`: if the current path is under `/student`, `/instructor`, `/business`, or `/admin`, redirect to `/login`.
6. After login, [src/app/login/page.tsx](src/app/login/page.tsx) reads `user.roles[0].name` and routes:
   - `admin` → `/admin`
   - `business` → `/business`
   - `author` → `/instructor`
   - anything else → `/student`

## Commands

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm start         # serves build output
npm run lint
```

There is no test script, no type-check script, and no format script. If you add tests, wire `test` into `package.json` and update this file.

## Environment

There is **no `.env.example`** committed. Required at runtime:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

The base URL is read in [src/lib/axios.ts](src/lib/axios.ts); the FE derives `ROOT_URL` from it (splits on `/api`) for the `/sanctum/csrf-cookie` call. If the API runs on a different origin, **Sanctum requires the FE origin to be listed in `SANCTUM_STATEFUL_DOMAINS`** on the API side (`.env`).

CORS: API must also allow `Access-Control-Allow-Credentials: true` for the FE origin.

## Conventions

- **App Router rules:** server vs client components matter. Anything using `useState`, `useEffect`, browser APIs, or event handlers needs `"use client"` at the top.
- **Data fetching:** local `useState` + `useEffect` pattern is current convention. Don't introduce a state manager (Redux/Zustand/Context) without discussion — the codebase has deliberately avoided one.
- **Styling:** Tailwind utility classes inline; use `clsx` + `tailwind-merge` for conditional classes. No CSS modules, no styled-components.
- **Icons:** `lucide-react` only. Don't add another icon set.
- **Images:** `next/image`. If you need a new remote host, add it to `remotePatterns` in [next.config.ts](next.config.ts).
- **Color/theme:** brand primary is `#0056D2` (see `globals.css`). The design tone is called "operator-grade density" — tight spacing, bold text, dark blue.
- **No error boundaries currently exist** — a route exception will crash the app. Add `error.tsx` per segment when handling fallible flows.

## Red flags / known issues

1. **Work is paused on the frontend** (per user). Notable stubs/incomplete:
   - `src/app/admin/` (empty stub)
   - `src/app/business/` (minimal)
   - `src/app/drill/take/[token]/` (likely incomplete)
   - `src/app/instructor/ai-generator/` (minimal)
2. **Mock data on the landing page.** [src/app/page.tsx](src/app/page.tsx) has hard-coded mock courses instead of calling the API. Replace before launch.
3. **CAPTCHA on register is client-side math** — not a real bot defense.
4. **No SEO metadata** beyond root layout.
5. **No error boundaries, no Suspense fallbacks, no loading skeletons** — pages show "Loading…" only.
6. **No refresh-token handling.** Session expires → 401 → redirect. Acceptable for Sanctum, but no UX warning.
7. **`localStorage.removeItem('token')` in logout** is dead code — kept only because it's harmless.
8. **PaymentModal** (M-Pesa) initiates the STK push but doesn't poll for completion.
9. **`docs/API_SPEC.md` on the API side is wrong about auth** (claims JWT). Trust this file's auth section, not that one.
10. **No tests.** Any non-trivial change must be manually verified in the browser — and you must say so explicitly when reporting work.

## Workflow expectations

- **Always run `npm run dev` and open the affected page** for UI changes. Type-check passing is not feature-working.
- **When adding an API call,** confirm the endpoint exists in `../visiondrill_api/routes/api.php`. The FE has called endpoints that don't exist.
- **When changing auth-touching code,** also verify the cookie flow end-to-end — DevTools → Application → Cookies → check `XSRF-TOKEN` and `laravel_session` are present.
- **App Router server components cannot use browser APIs.** When you see `cookies()` / `headers()` from `next/headers`, that's server-side only.

## Useful skills for this repo

- `frontend-patterns` — React/Next.js patterns
- `coding-standards` — TS/React standards
- `e2e-testing` — when adding Playwright (none exists yet)
- `api-design` — when designing endpoints to request from the API team

## FE↔API endpoints used today

Cross-reference with `../visiondrill_api/CLAUDE.md` for the API-side surface. The full FE call sites live under `src/app/*/page.tsx` and use the `api` instance from [src/lib/axios.ts](src/lib/axios.ts).
