<!-- Copilot instructions for AI coding agents working on this repository -->
# Copilot Instructions — smart-journey-hub

Purpose
- Short, actionable guidance for editing and extending this Vite + React + TypeScript app.

Quick start (dev & build)
- Dev server: `npm run dev` (runs `vite`).
- Build: `npm run build` (production) or `npm run build:dev` (development build).
- Preview production build: `npm run preview`.
- Lint: `npm run lint` (ESLint configured).

High‑level architecture
- Frontend single page app (Vite + React + TypeScript) with routing in `src/App.tsx` using `react-router-dom`.
- UI: components are in `src/components/ui` following the shadcn/Radix + Tailwind pattern (e.g., `button.tsx`, `card.tsx`).
- Pages: top-level routes live in `src/pages` (e.g., `Translator.tsx`, `Places.tsx`, `ARScanner.tsx`).
- State/data flows:
  - Local app state and React Query (`@tanstack/react-query`) for async data.
  - Static demo data in `src/lib/tourist-data.ts` (used as sample/place data).
  - Auth + backend via Supabase: client wrapper at `src/integrations/supabase/client.ts`.

Important conventions
- Path alias: `@/` maps to `src/` (see `tsconfig.json`). Use `@/` for imports across the codebase.
  - Example: `import { supabase } from "@/integrations/supabase/client";`
- UI components are small, single-responsibility files in `src/components/ui`. Follow existing prop patterns and className merging.
- Hooks live in `src/hooks` (e.g., `useAuth.tsx`, `use-toast.ts`) — prefer using these hooks for auth/toast behaviors rather than duplicating logic.

Integrations & external services
- Supabase:
  - Client: `src/integrations/supabase/client.ts` (uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
  - Serverless functions: `supabase/functions/translate/index.ts` — Deno function that expects `AI_API_KEY` in environment.
  - Migrations live under `supabase/migrations`.
- AI/translation: the `Translator` page calls the Supabase function `translate` via `supabase.functions.invoke('translate')` (see `src/pages/Translator.tsx`).

Code patterns to follow (concrete examples)
- Use `supabase` wrapper for all backend calls. Example:
  - `const { data, error } = await supabase.from('places').select('*')` or `supabase.functions.invoke('translate', { body })`.
- Use React Query for data fetching when data is asynchronous and cacheable.
- Reuse `src/components/ui/*` components instead of adding ad‑hoc UI primitives.
- Keep Tailwind classes in `className` and small composition helpers in `src/lib/utils.ts` when needed.

Env & secrets
- Vite env vars must be prefixed with `VITE_` for client usage. Important vars used here:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase serverless functions expect `AI_API_KEY` in the server/Deno environment (not prefixed by `VITE_`).

Dev notes / gotchas
- No test framework is included—avoid adding tests without a plan for runner/config.
- The translate function is provider-agnostic and expects an external AI endpoint; update `supabase/functions/translate/index.ts` when changing the AI provider.
- Many UI components follow shadcn examples; copy existing file structure and prop names when creating new components.

Where to look when you are stuck
- Routing & pages: `src/App.tsx` and `src/pages/*`.
- Auth: `src/hooks/useAuth.tsx` and `src/integrations/supabase/client.ts`.
- Shared data & helpers: `src/lib/*` (e.g., `tourist-data.ts`, `utils.ts`).
- UI building blocks: `src/components/ui/*` and `src/components/layout/Header.tsx`.

When making changes
- Keep changes minimal and consistent with existing style.
- Update imports to use `@/` alias.
- Run `npm run dev` and `npm run lint` locally to validate runtime and linting.

If unclear
- Ask here which files to update and whether changes should be wired to Supabase (server) or local mock data (`src/lib/tourist-data.ts`).

— end
