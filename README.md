# HIO Nexus — AI Cinematic Production Platform

> "Your story deserves a screen."  
> From manuscript to movie. Story → Screenplay → Characters → Scenes → Storyboard → Export.

HIO Nexus is a production-grade AI film studio in the browser. It takes a biography, manuscript, novel, or memoir and runs it through a complete cinematic production pipeline — adaptation, screenplay, character bible, scene breakdown, storyboard, and export.

---

## Feature List

### Phase 1 (this build — foundation complete)
- ✅ Clerk authentication (sign-up, sign-in, webhooks, user sync to DB)
- ✅ Supabase PostgreSQL database via Prisma ORM
- ✅ 20-model Prisma schema (matches PDF spec exactly)
- ✅ Rights & Safety Layer — declaration, classification (USER_OWNED / PUBLIC_DOMAIN / LICENSED / NEEDS_REVIEW / RISKY / BLOCKED)
- ✅ Story analysis via Claude AI — extracts genre, characters, arc, conflicts, themes, logline
- ✅ Adaptation engine via Claude AI — treatment, beat sheet, act structure, narration plan, visual style guide
- ✅ Character bible generation via Claude AI — full profiles with visual descriptions, voice style, continuity notes
- ✅ Scene breakdown generation via Claude AI — full scene planner with camera direction, mood, music cue
- ✅ Storyboard & shot list generation via Claude AI — shot descriptions + AI generation prompts for each shot
- ✅ Credits system — per-action deduction with transaction history
- ✅ Render job tracking — all AI operations logged with status
- ✅ Export package system — request queue for all 12 export types from spec
- ✅ Provider abstraction layer — stubbed for Kling, Runway, Veo, LTX, Pika (Phase 2 wiring)
- ✅ Admin health API — DB stats, provider readiness, failed jobs
- ✅ Clerk webhook handler — user.created, user.updated, user.deleted
- ✅ Full API layer (15 routes) with Zod validation and auth guards
- ✅ 6 Server Actions with revalidation
- ✅ Plan limits: Free (1 project), Creator (10), Studio (50), Enterprise (unlimited)
- ✅ Subscription plan seed data
- ✅ Dashboard page (Server Component, live DB data)
- ✅ Project hub page with pipeline step navigator
- ✅ Cinematic dark-mode UI foundation (CSS variables, Tailwind config, gold accent system)
- ✅ Landing page

### Phase 2 (next sprint — UI components)
- ⏳ `NewProjectForm` — multi-step wizard (Simple Mode / Studio Mode)
- ⏳ `RightsForm` — rights declaration UI
- ⏳ `CharacterCard` / `CharacterForm` — character bible editor
- ⏳ `SceneRow` / `SceneForm` — scene planner table + editor
- ⏳ `ShotCard` — storyboard grid with generation prompts
- ⏳ Sidebar navigation with active state
- ⏳ Full adaptation page with inline editing
- ⏳ Export page with package list + download UI
- ⏳ Admin diagnostics dashboard (live health panel)
- ⏳ PDF/ZIP document generation worker (adaptation report, screenplay, storyboard, character bible)
- ⏳ MP4 animatic stitching via ffmpeg background worker
- ⏳ Real video provider wiring (Kling, Runway, Veo, LTX, Pika)
- ⏳ ElevenLabs voice integration
- ⏳ Timeline editor

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| AI | Anthropic Claude (claude-opus-4-5) |
| Storage | Supabase Storage |
| Validation | Zod |
| Toasts | Sonner |
| Webhooks | Svix |

---

## Step-by-Step Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd hio-nexus
npm install
```

### 2. Create environment file

```bash
cp .env.example .env.local
```

Then fill in every value (see sections below for where to find each one).

### 3. Set up Clerk

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and create a new application.
2. Copy **Publishable Key** and **Secret Key** into `.env.local`.
3. In Clerk Dashboard → **Webhooks** → Add endpoint:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`
4. In Clerk Dashboard → **Redirects**, confirm:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

### 4. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. In **Settings → Database → Connection string**:
   - Copy **Transaction pooler URI** → `DATABASE_URL` (add `?pgbouncer=true` at end)
   - Copy **Session pooler URI** or **Direct connection** → `DIRECT_URL`
4. Create storage buckets in Supabase → **Storage → New bucket**:
   - `story-uploads` (private)
   - `generated-assets` (private)
   - `exports` (private)

### 5. Run database migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase (development)
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate

# Seed subscription plans
npm run db:seed
```

### 6. Get Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys.
2. Create a new key → `ANTHROPIC_API_KEY`.

### 7. Set admin access

```bash
# In .env.local, add your Clerk user ID(s):
ADMIN_CLERK_IDS=user_xxxxxxxxxxxxxxxxxxxxxxxx
```

Find your Clerk user ID: Clerk Dashboard → Users → click your account.

### 8. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo.
3. In **Environment Variables**, add every variable from `.env.example`.
4. For `DATABASE_URL`, use the **Transaction pooler** connection string from Supabase.
5. For `DIRECT_URL`, use the **Session pooler** or direct connection string.
6. Deploy.
7. After deploy, update your Clerk webhook URL to your Vercel domain.
8. Run migrations against production:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

---

## API Reference

All routes require Clerk authentication except webhooks and the landing page.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user` | Get/create current DB user |
| GET | `/api/credits` | Credit balance + transaction history |
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project + source document |
| GET | `/api/projects/[id]` | Full project with all relations |
| PATCH | `/api/projects/[id]` | Update project metadata |
| DELETE | `/api/projects/[id]` | Delete project (cascades all data) |
| POST | `/api/projects/[id]/rights` | Submit rights declaration |
| POST | `/api/projects/[id]/analyze` | Run AI story analysis (1 credit) |
| GET | `/api/projects/[id]/adaptation` | Get adaptation document |
| POST | `/api/projects/[id]/adaptation` | Generate full adaptation via AI (1 credit) |
| PATCH | `/api/projects/[id]/adaptation` | Manual edit adaptation fields |
| GET | `/api/projects/[id]/characters` | List characters |
| POST | `/api/projects/[id]/characters` | Generate characters via AI (1 credit) or create manually |
| GET | `/api/projects/[id]/scenes` | List scenes |
| POST | `/api/projects/[id]/scenes` | Generate scenes via AI (1 credit) or create manually |
| GET | `/api/projects/[id]/storyboard` | Get storyboard frames |
| POST | `/api/projects/[id]/storyboard` | Generate storyboard prompts (1 credit) |
| GET | `/api/projects/[id]/export` | List export packages |
| POST | `/api/projects/[id]/export` | Request export package (1 credit) |
| GET | `/api/admin/health` | System diagnostics (admin only) |
| POST | `/api/webhooks/clerk` | Clerk user lifecycle events |

### Create a Project (example)

```bash
curl -X POST https://your-app.vercel.app/api/projects \
  -H "Authorization: Bearer <clerk-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Father's Story",
    "mode": "SIMPLE",
    "movieStyle": "DOCUMENTARY",
    "targetLength": "PILOT_10MIN",
    "rawText": "Born in 1942 in Lagos, my father...",
    "fileType": "TEXT"
  }'
```

---

## Folder Structure

```
hio-nexus/
├── actions/          # Server Actions (project, adaptation, characters, scenes, storyboard, export)
├── app/
│   ├── (auth)/       # Clerk sign-in / sign-up pages
│   ├── (dashboard)/  # Protected dashboard shell + all pages
│   ├── api/          # All API routes
│   ├── globals.css   # CSS variables + Tailwind base
│   └── layout.tsx    # Root layout (Clerk, Toaster)
├── components/       # UI components (Phase 2)
├── hooks/            # useProject, useProjects
├── lib/
│   ├── ai.ts         # Claude AI helpers (story analysis, adaptation, characters, scenes, storyboard)
│   ├── auth.ts       # Clerk + DB user helpers, credit deduction, rights classification
│   ├── prisma.ts     # Prisma client singleton
│   ├── provider-abstraction.ts  # Video provider interface + stubs
│   ├── supabase.ts   # Supabase storage helpers
│   ├── utils.ts      # cn(), formatDate(), truncate(), etc.
│   └── validations.ts # Zod schemas for all entities
├── prisma/
│   ├── schema.prisma # 20 models, all enums
│   └── seed.ts       # Subscription plans seed
├── types/
│   └── index.ts      # Prisma re-exports + label maps + plan constants
├── middleware.ts     # Clerk auth middleware
├── .env.example      # All required env vars
└── plan.md           # Full file structure + API route map
```

---

## Implementation Notes

These are decisions made where the PDF specification was ambiguous:

1. **AI Provider for text intelligence**: The PDFs specify video providers (Kling, Veo, Runway etc.) but don't name an LLM for story analysis. Decision: Use **Anthropic Claude (claude-opus-4-5)** for all text intelligence — story analysis, adaptation, character generation, scene breakdown, storyboard prompts. This is the most capable option and aligns with the "orchestration layer" vision.

2. **File upload in Phase 1**: PDFs specify PDF, DOCX, TXT upload. Full binary parsing (pdfjs + mammoth) requires a background worker pipeline. Phase 1 accepts raw text paste. File upload endpoint is architected (`/api/projects` accepts `fileUrl`), full parsing queued for Phase 2.

3. **MP4 Animatic**: Requires ffmpeg server-side processing. The architecture is fully stubbed — `RenderJob` model, `EXPORT_PACKAGE` job type, export queue. Actual stitching in Phase 2 via a background worker.

4. **Rights classification logic**: PDFs define 6 classification states but not the decision rules. Implemented as: BLOCKED = involves real people + sensitive claims + doesn't own story; RISKY = sensitive claims without anonymization; PUBLIC_DOMAIN = isPublicDomain true; USER_OWNED = ownsStory true; LICENSED = hasAdaptationRights true; else NEEDS_REVIEW.

5. **Admin access control**: PDFs mention admin/diagnostics panel but not how admin role is managed. Decision: Admin access gated by `ADMIN_CLERK_IDS` env var (comma-separated Clerk user IDs). No database role table needed for Phase 1.

6. **Credit costs per action**: PDFs define a credits system but not per-action costs. Decision: 1 credit per AI operation — story analysis, adaptation generation, character generation, scene generation, storyboard generation, export request. This is conservative and can be adjusted.

7. **Simple vs Studio Mode**: Both modes share the same data model and pipeline. Mode is stored on `Project`. In Phase 2, Simple Mode will hide advanced fields and run the full pipeline automatically on "Create My Movie" click.

8. **Feature Film length**: PDFs list "Feature Film" as a target length with the note "roadmap." Decision: Accepted as a valid input but renders an honest message that feature-length rendering requires configured render providers. The system generates full scene/storyboard sets regardless.

9. **Video providers in Phase 1**: All video providers (Kling, Runway, Veo, LTX, Pika) are stubbed via the `VideoProvider` interface from the PDF spec. Calling `getResult()` on any provider without an API key returns the spec-required message: *"Final cinematic rendering requires a connected render provider."*
