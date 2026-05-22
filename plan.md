# HIO Nexus — Phase 1 Build Plan

## Source of Truth
Both PDFs (HIO_Nexus_2.pdf and HIO_NEXUS-WPS_Office.pdf) describe the same spec.
The WPS_Office PDF adds: "generate the complete Next.js project structure and code for HIO Nexus MVP."
This plan is derived directly from the PDF specifications.

---

## File & Folder Structure

```
hio-nexus/
├── app/
│   ├── layout.tsx                          # Root layout (Clerk provider, fonts, Toaster)
│   ├── globals.css                         # CSS variables, Tailwind base
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx # Clerk sign-in
│   │   └── sign-up/[[...sign-up]]/page.tsx # Clerk sign-up
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # Dashboard shell (sidebar, topbar)
│   │   ├── dashboard/page.tsx              # User dashboard — active projects, credits, status
│   │   ├── projects/
│   │   │   ├── new/page.tsx                # New project wizard (Simple / Studio mode)
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Project overview / hub
│   │   │       ├── adaptation/page.tsx     # Adaptation engine — logline, synopsis, beat sheet
│   │   │       ├── characters/page.tsx     # Character bible — list + editor
│   │   │       ├── scenes/page.tsx         # Scene planner — breakdown table
│   │   │       ├── storyboard/page.tsx     # Storyboard grid — shot cards
│   │   │       ├── pipeline/page.tsx       # Cinematic generation pipeline + render jobs
│   │   │       └── export/page.tsx         # Output system — download all packages
│   │   └── admin/page.tsx                  # Admin diagnostics panel
│   └── api/
│       ├── user/route.ts                   # GET/POST — sync Clerk user → DB
│       ├── credits/route.ts                # GET credits balance
│       ├── projects/
│       │   ├── route.ts                    # GET list / POST create project
│       │   └── [id]/
│       │       ├── route.ts                # GET / PATCH / DELETE project
│       │       ├── rights/route.ts         # POST rights declaration
│       │       ├── analyze/route.ts        # POST trigger story analysis (AI)
│       │       ├── adaptation/route.ts     # GET / POST / PATCH adaptation doc
│       │       ├── characters/route.ts     # GET / POST characters
│       │       ├── scenes/route.ts         # GET / POST scenes
│       │       ├── storyboard/route.ts     # GET / POST storyboard frames
│       │       └── export/route.ts         # POST request export package
│       ├── admin/
│       │   └── health/route.ts             # GET system health diagnostics
│       └── webhooks/
│           └── clerk/route.ts              # POST Clerk webhook → sync user events
├── actions/
│   ├── project.actions.ts                  # Server Actions: createProject, deleteProject, updateProject
│   ├── adaptation.actions.ts               # Server Actions: generateAdaptation, updateAdaptation
│   ├── character.actions.ts                # Server Actions: generateCharacters, updateCharacter
│   ├── scene.actions.ts                    # Server Actions: generateScenes, updateScene
│   ├── storyboard.actions.ts               # Server Actions: generateStoryboard
│   └── export.actions.ts                   # Server Actions: requestExport
├── components/
│   ├── ui/                                 # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── progress.tsx
│   │   ├── scroll-area.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── tooltip.tsx
│   │   └── avatar.tsx
│   ├── layout/
│   │   ├── sidebar.tsx                     # Navigation sidebar
│   │   ├── topbar.tsx                      # Top bar with user menu
│   │   └── page-header.tsx                 # Reusable page header
│   ├── dashboard/
│   │   ├── project-card.tsx                # Dashboard project card
│   │   ├── stats-bar.tsx                   # Credits / project stats
│   │   └── status-badge.tsx                # Project status pill
│   ├── project/
│   │   ├── project-status-stepper.tsx      # Visual pipeline step tracker
│   │   ├── character-card.tsx              # Character bible card
│   │   ├── scene-row.tsx                   # Scene planner table row
│   │   ├── shot-card.tsx                   # Storyboard shot card
│   │   ├── render-job-row.tsx              # Render job status row
│   │   └── export-item.tsx                 # Export package download item
│   └── forms/
│       ├── new-project-form.tsx            # Project creation multi-step form
│       ├── rights-form.tsx                 # Rights declaration form
│       ├── character-form.tsx              # Character editor form
│       └── scene-form.tsx                  # Scene editor form
├── hooks/
│   ├── use-project.ts                      # SWR hook — fetch single project with relations
│   ├── use-projects.ts                     # SWR hook — fetch user project list
│   └── use-toast.ts                        # Toast helper hook (re-export from sonner)
├── lib/
│   ├── prisma.ts                           # Prisma client singleton
│   ├── ai.ts                               # Claude AI helper functions (story analysis, adaptation, etc.)
│   ├── utils.ts                            # cn(), formatDate(), truncate(), etc.
│   ├── validations.ts                      # Zod schemas for all entities
│   └── auth.ts                             # Clerk currentUser helpers + DB user sync
├── types/
│   └── index.ts                            # Re-exported Prisma types + app-level constants
├── prisma/
│   ├── schema.prisma                       # Full schema — 20 models, all enums
│   └── seed.ts                             # Seed: subscription plans + demo user
├── middleware.ts                           # Clerk auth middleware — protected route matcher
├── .env.example                            # All required env vars with descriptions
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json                         # shadcn/ui config
└── README.md
```

---

## API Routes Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/user | ✓ | Get current DB user (creates if new) |
| GET | /api/credits | ✓ | Get credit balance for current user |
| GET | /api/projects | ✓ | List all projects for current user |
| POST | /api/projects | ✓ | Create project + source document |
| GET | /api/projects/[id] | ✓ | Get project with all relations |
| PATCH | /api/projects/[id] | ✓ | Update project metadata |
| DELETE | /api/projects/[id] | ✓ | Delete project + cascade |
| POST | /api/projects/[id]/rights | ✓ | Submit rights declaration |
| POST | /api/projects/[id]/analyze | ✓ | Trigger AI story analysis → update adaptation |
| GET | /api/projects/[id]/adaptation | ✓ | Get adaptation document |
| POST | /api/projects/[id]/adaptation | ✓ | Generate adaptation via AI |
| PATCH | /api/projects/[id]/adaptation | ✓ | Manual update of adaptation fields |
| GET | /api/projects/[id]/characters | ✓ | List characters for project |
| POST | /api/projects/[id]/characters | ✓ | Generate or create characters |
| GET | /api/projects/[id]/scenes | ✓ | List scenes for project |
| POST | /api/projects/[id]/scenes | ✓ | Generate or create scenes |
| GET | /api/projects/[id]/storyboard | ✓ | Get storyboard frames + shots |
| POST | /api/projects/[id]/storyboard | ✓ | Generate storyboard prompts |
| POST | /api/projects/[id]/export | ✓ | Request export package |
| GET | /api/admin/health | Admin | System diagnostics |
| POST | /api/webhooks/clerk | Public | Clerk user lifecycle events |

---

## Data Models (20 Prisma models)

From PDF spec → implemented exactly:
User, Project, SourceDocument, RightsDeclaration, Adaptation, Character, Scene, Shot,
StoryboardFrame, VoiceAsset, MusicAsset, GeneratedClip, MovieTimeline, RenderJob,
ExportPackage, ProviderCredential, CreditTransaction, SubscriptionPlan, ReviewComment,
VersionHistory

---

## MVP Scope (from PDF)

Phase 1 (this build):
- ✅ Story upload/import
- ✅ Rights declaration
- ✅ Adaptation analysis (AI)
- ✅ Screenplay/treatment generation (AI)
- ✅ Character bible (AI)
- ✅ Scene breakdown (AI)
- ✅ Storyboard prompts/cards (AI)
- ✅ Project package ZIP
- ⏳ MP4 animatic (requires ffmpeg worker — post Phase 1)
- ⏳ Render-provider handoff (architecture stubbed, providers not wired)

Phase 2 (post Phase 1):
- Fully rendered cinematic video
- Full voice/music mix (ElevenLabs, etc.)
- Timeline editor
- Provider orchestration (Kling, Veo, Runway, LTX, Pika)
- Full movie export

---

## Provider Abstraction (stubbed in Phase 1)

```typescript
interface VideoProvider {
  generateShot(input: ShotGenerationInput): Promise<GeneratedShot>;
  checkStatus(jobId: string): Promise<RenderStatus>;
  getResult(jobId: string): Promise<VideoAsset>;
}
```

Providers to wire in Phase 2: Google Veo, Kling, Runway, LTX, Pika, Stable Video.
Voice: ElevenLabs. Music: Suno / Udio. Images: DALL-E 3 / Stable Diffusion.

---

## Implementation Notes (ambiguous decisions)

1. **AI Provider**: PDFs mention multiple video providers but no LLM for text analysis.
   Decision: Use Claude (Anthropic) for all text intelligence — story analysis, adaptation, 
   character generation, scene breakdown, storyboard prompts. This is the most capable
   option and aligns with the "orchestration layer" vision.

2. **File Upload**: PDFs mention PDF, DOCX, TXT upload.
   Decision: Phase 1 accepts raw text paste + TXT. PDF/DOCX parsing requires a worker
   pipeline (pdfjs + mammoth). Stubbed API endpoint; full parsing in Phase 2.
   Supabase Storage is configured for file uploads.

3. **MP4 Animatic**: Requires ffmpeg server-side processing.
   Decision: Architecture stubbed with RenderJob model. Actual stitching in Phase 2 via
   a background worker (BullMQ or Inngest).

4. **Rights Classification**: PDFs define 6 classification states.
   Decision: Classification is computed server-side from the rights declaration boolean
   fields. BLOCKED = involvesRealPeople + hasSensitiveClaims + !ownsStory.

5. **Admin Panel**: PDFs say "admin/diagnostics" but don't specify role management.
   Decision: Admin access gated by ADMIN_USER_IDS env var (comma-separated Clerk IDs).

6. **Credits System**: PDFs define credits but not exact costs per action.
   Decision: Story analysis = 1 credit, Adaptation = 1 credit, Characters = 1 credit,
   Scenes = 1 credit, Storyboard = 1 credit, Export package = 1 credit.

7. **Simple vs Studio Mode**: Both modes share the same data model.
   Decision: Mode is stored on Project. Simple mode hides advanced fields in the UI.

8. **Feature Film length**: PDFs include "feature film" as a length option but note it's
   a "roadmap" item. Decision: Accepted as input but renders a clear message that 
   feature-length rendering requires render provider setup.
