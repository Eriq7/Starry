# CLAUDE.md

## Project Overview

Starry (星空) — binds NASA APOD astronomy photos with users' life moments. Users input important dates, see what the universe looked like that day, and generate shareable visual cards. English-only, targeting social media virality.

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deployment**: Vercel
- **Image Generation**: Browser-side Canvas (images proxied through `/api/apod/image/[date]`)

## Rules

1. **Module READMEs**: When creating or significantly modifying a major directory (e.g. `src/components/`, `src/lib/`, `src/api/`), maintain a `README.md` inside that directory explaining what the module does and how it fits into the overall architecture.

2. **File-level comments**: Every source file must begin with a comment block describing what this specific file does, its main responsibilities, and any important caveats.

3. **Address the user**: Always address me as "瑞" at the start of every reply.

4. **Plan management**: At the start of every session, check for `PLAN.md` in the project root. If it does not exist, proactively create it by asking the user to outline the project phases before proceeding with any implementation. If it exists, read it in full to understand the overall plan, current phase, and completion status. After finishing any phase or significant milestone, immediately update the corresponding entry in `PLAN.md` with a ✅ status and a brief note on what was completed.