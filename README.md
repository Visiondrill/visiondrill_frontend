# VisionDrill Frontend

Next.js 16 (App Router) client for the **VisionDrill** e-learning platform — student dashboards, instructor curriculum tools, course catalog, AI-assisted learning UI.

The companion backend lives in [`visiondrill_api`](https://github.com/mmrysir/visiondrill_api) (Laravel 8, Sanctum cookie SPA auth).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js `16.2.6` (App Router, Turbopack dev) |
| React | `19.2.4` |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`), `@theme` variables in `globals.css` |
| Icons | `lucide-react` |
| HTTP | Axios 1.x via `src/lib/api.ts` (CSRF interceptor, 401 redirect) |
| State | Local `useState` only — **no global store, by design** |
| Sanitization | `isomorphic-dompurify` (via `src/lib/sanitize.ts`) |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` (curriculum editor) |
| Video | `react-player` |
| Markdown | `react-markdown` |
| Toasts | `react-hot-toast` |
| Tests | None configured |

## Prerequisites

- Node.js 20+ (Next 16 / React 19)
- npm 9+ (lockfile is `package-lock.json`)
- A running `visiondrill_api` instance (see its README) — the FE makes no sense without it

## Local setup

```bash
git clone git@github.com:mmrysir/visiondrill_frontend.git
cd visiondrill_frontend

npm install

# Required env (no .env.example committed)
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/api' > .env.local

npm run dev   # http://localhost:3000
```

The API must be reachable at `NEXT_PUBLIC_API_URL` and must list this origin in its `SANCTUM_STATEFUL_DOMAINS`.

## Commands

```bash
npm run dev      # Next.js dev server on :3000 (Turbopack, HMR)
npm run build    # Production bundle to .next/
npm start        # Serve the production build
npm run lint     # ESLint (Next.js config)
npx tsc --noEmit # Type-check without emitting
```

There is no `test` script — the project has no test framework set up.

## Project structure

```text
src/app/                       Next.js App Router pages (file-based)
  page.tsx                     Landing
  login/, register/, logout/   Auth pages
  student/                     Student dashboard (protected)
  instructor/                  Instructor dashboard (protected)
  business/                    Business tier (protected)
  admin/                       Admin panel (protected, layout enforces role)
  courses/[slug]/              Public course detail
  courses/[slug]/learn/        Lesson player
  drill/take/[token]/          Anonymous drill via shared token
  about/, careers/, ...        Static / marketing pages

src/components/                Shared UI components
src/lib/
  api.ts                       Axios instance + CSRF + 401 interceptor
  sanitize.ts                  DOMPurify wrapper for instructor-authored HTML
src/types/                     TypeScript interfaces
public/                        Static assets
legacy/                        Old Vue/Laravel-Mix setup — reference only

next.config.ts                 Allows remote images from localhost:8000 + unsplash.com
```

Detailed session context (auth flow, conventions, known stubs) for Claude/Codex/Cursor is in [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md).

## Auth flow

Laravel Sanctum cookie-based SPA auth — **no bearer tokens, no localStorage tokens.**

1. On the login/register page, `getCsrfCookie()` calls `GET /sanctum/csrf-cookie` to seed `XSRF-TOKEN`.
2. The Axios instance (`src/lib/api.ts`) automatically sends `X-XSRF-TOKEN` on POST/PUT/PATCH/DELETE, with `withCredentials: true`.
3. On `419 CSRF token mismatch` the interceptor refreshes the cookie and retries once.
4. On `401` from a protected segment (`/student`, `/instructor`, `/business`, `/admin`), the interceptor redirects to `/login`.
5. After login, [`src/app/login/page.tsx`](src/app/login/page.tsx) reads `user.roles[0].name` and routes:
   - `admin` → `/admin`
   - `business` → `/business`
   - `author` → `/instructor`
   - else → `/student`

The `/admin` route has an additional `src/app/admin/layout.tsx` guard that calls `/me` on mount and redirects anyone without the `admin` role.

## Conventions

- **Server vs client components.** Anything using `useState`, `useEffect`, browser APIs, or event handlers needs `"use client"` at the top.
- **`useSearchParams` must be inside a `<Suspense>` boundary** or `next build` will fail with a prerender error. Examples: `register/page.tsx`, `instructor/ai-generator/page.tsx`, `courses/[slug]/learn/page.tsx`.
- **Data fetching: local `useState` + `useEffect`.** Don't introduce Redux/Zustand/Context without team buy-in.
- **Styling: Tailwind utilities inline.** Use `clsx` + `tailwind-merge` for conditional classes. No CSS modules, no styled-components.
- **Icons: `lucide-react` only.**
- **HTML sanitization is required** for any user-authored HTML rendered via `dangerouslySetInnerHTML` — use `sanitizeHtml()` from `src/lib/sanitize.ts`.
- **Images: `next/image`.** New remote hosts go in `remotePatterns` in [`next.config.ts`](next.config.ts).

## Brand / design

- Primary color: `#0056D2` (see `globals.css` `@theme`)
- Font: Poppins via `next/font/google` (weights 300–900)
- Tone: "operator-grade density" — tight spacing, bold text, dark blue accents

## Production build

```bash
npm run build      # 35 routes prerender / SSR
npm start          # serves .next/
```

## Production deploy notes

- Set `NEXT_PUBLIC_API_URL` to the production API base URL (e.g. `https://api.visiondrill.com/api`)
- The production API must list this FE's origin in `SANCTUM_STATEFUL_DOMAINS` and serve cookies with `SESSION_SECURE_COOKIE=true`
- The API's CORS allowlist (`CORS_ALLOWED_ORIGINS` env or `app/Http/Middleware/Cors.php`) must include this origin

## Known issues / paused work

- Landing page (`src/app/page.tsx`) renders **mock courses**, not live data — replace before launch.
- `/admin` dashboard renders a stub with hardcoded placeholder stats (`2,450 users`, etc.) — the auth guard is wired, the data is not.
- `/business` and `/drill/take/[token]/` are minimal/incomplete.
- M-Pesa `PaymentModal` initiates STK push but doesn't poll for completion.
- Math CAPTCHA on register is client-side only — not a real bot defense.
- No error boundaries (`error.tsx`) per segment yet — a runtime exception in a page can crash the segment.
- No automated tests.

## License

Proprietary — VisionDrill.
