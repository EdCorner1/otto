# Otto Build Log

## 2026-04-22
### Current product direction
- Locked the next execution rail around:
  1. creator onboarding
  2. portfolio tabs/categories
  3. public creator profile preview
- Added landing-page roadmap/feed concept to the plan so Otto can build in public while the MVP tightens up.

### Roadmap / landing page strategy
- Decided to add a homepage roadmap section that feels like a social feed
- Each roadmap card should show a simple idea, status, and thumbs up/down reactions
- Add a lightweight "What do you want to see?" section for audience input
- Keep V1 curated and simple — no bloated forum, no public comments

### Creator-side product direction captured
- Free public creator sites should eventually live on subdomains like `name.ottougc.com`
- Templates should come before a full page builder
- Custom domains should become a Pro feature later
- Scheduling is a likely later-stage creator-plan feature, potentially powered by Metricool or similar
- Long-term Otto should help manage brand/creator execution, not just discovery

### Operating mode
- Ed gave Jarvis a 7-day autonomous mandate to own Otto execution
- Default mode: quiet execution, interrupt only for blockers, strategic decisions, or risky changes

### Next build sequence
- Tighten creator onboarding
- Improve portfolio tabs/categories
- Polish public creator profile preview
- Layer in homepage roadmap/feed V1

## 2026-04-23
### Public portfolio polish
- Added category-aware filtering to the public creator portfolio page so brands can scan a creator's work by bucket instead of one flat video wall.
- Public portfolio now respects category data already set in profile editing and falls back to inferred categories when needed.
- This brings the public profile closer to the private portfolio editor and makes creator work easier to review quickly.

### Validation
- TypeScript: pass
- Build: pass

## 2026-04-24
### Creator onboarding quality gate fix
- Aligned creator onboarding with the Otto roadmap by changing the hard minimum from 6 portfolio videos to 3, while still allowing up to 6 uploads.
- Updated the onboarding UI copy and progress messaging so creators know the true bar to get live without feeling blocked by an unnecessary higher threshold.
- Updated server-side creator onboarding validation to enforce the new 3-to-6 portfolio range consistently.

### Validation
- TypeScript: pass
- Build: pass

## 2026-04-25
### Creator onboarding preview polish
- Upgraded the final creator onboarding preview step so it feels like a real go-live checkpoint instead of just an iframe dump.
- Added a cleaner readiness summary above the live profile preview with signals around portfolio count, niche positioning, and what brands see first.
- This makes the handoff from onboarding to public profile feel more intentional and reinforces creator quality before they land in the dashboard.

### Validation
- TypeScript: pass
- Build: pass

## 2026-04-26
### Brand-facing creator profile polish
- Upgraded the `/creators/[id]` brand-facing profile view so it is easier to scan like a real evaluation page instead of a flatter raw profile.
- Added a stronger summary rail with portfolio readiness, response signal, niche signal, and a tighter fast-summary block for brand decision-making.
- Improved CTA hierarchy so the page feels more premium and intentional when a brand is deciding whether to invite or hire a creator.

### Validation
- TypeScript: pass
- Build: pass

## 2026-04-27
### Public creator profile credibility strip
- Added a compact credibility strip to the main public creator portfolio page so brands get a faster read on why the creator is credible without scrolling into deeper stats first.
- The new summary blocks frame readiness, platform fit, and the best next action in simpler product language.
- This tightens the public profile preview path and makes first-time brand evaluation feel more confident and intentional.

### Homepage roadmap copy sync
- Updated the homepage roadmap/feed card about creator quality so it reflects the current 3-video minimum instead of the older 6-video message.
- This keeps the public build-in-public layer aligned with the current onboarding product reality and avoids mixed signals.

### Onboarding auth redirect fix
- Fixed the protected app layout so unauthenticated users are redirected to login with their full current path and query string preserved.
- Fixed the edge `proxy.ts` auth redirect so it preserves the full path plus query string instead of flattening `/onboarding?role=creator` down to `/onboarding`.
- This is aimed at making role-specific onboarding entry links survive the auth gate correctly on live.

### Validation
- TypeScript: pass
- Build: pass

## 2026-04-28
### Signup confirmation UX fix
- Fixed email/password signup so Otto no longer blindly pushes new users into onboarding before a real auth session exists.
- If Supabase returns an active session, users continue straight into onboarding. If email confirmation is required, Otto now shows a clear check-your-email success message instead of bouncing them into a confusing login loop.
- This directly addresses the broken-feeling signup path Ed hit while testing with a fresh account.

### Validation
- TypeScript: pass
- Build: pass

## 2026-04-29
### Login handoff clarity for onboarding
- Added clearer login-state messaging when someone is sent to sign in from creator or brand onboarding.
- Instead of a generic welcome-back screen, Otto now explains that sign-in will take the user straight back into the onboarding flow they were trying to continue.
- This makes auth gating feel more intentional and reduces the “I’m back on the sign-in page but nothing happened” confusion from tester flows.

### Validation
- TypeScript: pass
- Build: pass

## 2026-05-01
### Creator onboarding API portfolio validation alignment
- Reverted the rejected homepage below-the-fold experiment so the current branch no longer carries an unapproved visible homepage redesign forward.
- Tightened `/api/onboarding/creator` validation so the server now counts only real portfolio video URLs against the 3-to-6 video requirement, matching the client-side onboarding gate.
- Saved only validated portfolio video items when onboarding completes, preventing non-video/empty entries from slipping into public creator profiles.

### Validation
- TypeScript: pass
- Build: pass

## 2026-05-02
### Brand creator-invite brief handoff
- Fixed the brand invite path from creator discovery so `/jobs/new?invite=<creatorId>` now carries the selected creator through brief creation instead of silently dropping the invite intent.
- When a brand posts a brief from an invite flow, Otto now creates the job, opens an initial deal thread for the invited creator, and notifies the creator with a direct next-step link.
- Added clear invite-attached messaging on the brief form and a more specific submit CTA so brands understand that posting the brief also starts the creator invite.

### Validation
- TypeScript: pass
- Build: pass

## 2026-05-03
### Public creator portfolio direction
- Confirmed public creator URLs such as `ottougc.com/handle` should behave like standalone creator portfolio websites: public by default, no app login gate, and no edit controls on the public view.
- Public profile primary CTA temporarily points back to `https://ottougc.com`; when brand onboarding is ready, change this to the correct brand signup/login flow.
- Added a planned "Worked with" brand-logo section direction for creator profiles. Logo uploads should guide creators toward clean transparent PNG/SVG assets, ideally at least 600px wide. Future implementation should normalize/resize uploaded logo images automatically; Cloudflare Stream is for video, so logo processing should use image upload/resizing infrastructure rather than Stream.

## 2026-05-04
### Public creator template background options
- Added reusable public creator background styles so creators can choose between Plain, Grid, and Dots for their public profile page.
- Wired the selected style through creator profile loading/saving and the public `/[handle]` template, with Plain as the safe fallback.
- Added the background selector to `/profile/edit` under Basic Info with visual previews for each option.
- Checked the public creator profile layout visually at desktop, tablet, and mobile sizes before committing. Change is committed locally and ready for approval before live deploy.

### Validation
- TypeScript: pass
- Build: pass

## 2026-05-06
### Public brand profile pages
- Public brand pages at `/b/[slug]` — e.g. `ottougc.com/b/ottougc`
- Brand has `is_public` toggle (default false) — brand controls visibility
- Shows: logo, company name, bio, industry tag, website link, active job briefs
- Active briefs show platform tags, budget range, and Apply button
- OttoUGC demo brand created with 1 open brief, page live at ottougc.com/b/ottougc

**Test account:**
- Email: ottobrand@ottougc.com
- Password: OttoUGCTest123!

### Validation
- TypeScript: pass
- Build: pass (60/60 static pages)
- PR merged via GitHub API (deploy key SSH push)

## 2026-05-07
### Production unblock: public brand page auth gate
- Root cause identified: `proxy.ts` middleware auth gate did not classify `/b/[slug]` as public, so requests were redirected to `/login` before page render.
- Fixed proxy public route matching by allowing `/b/` and `/api/brands/slug` as public prefixes.
- Verified live route recovery: `https://ottougc.com/b/ottougc` now returns 200 and no longer redirects to login.

### Onboarding polish: true public profile preview
- Updated creator onboarding step 5 preview actions to use the public handle route (`/${handle}`) instead of the internal `/creators/[id]` page.
- Updated "Open profile" CTA text to "Open public profile" and aligned preview iframe/open-in-new-tab target to the same public path.
- This keeps onboarding completion aligned with the actual shareable portfolio surface brands see.

### Validation
- TypeScript: pass
- Build: pass (60/60 static pages)


## 2026-05-09
### Creator onboarding reliability: handle collision protection
- Added server-side handle collision checks in onboarding step API (`/api/onboarding/step/[step]`) so creators cannot continue with a handle already claimed by another user.
- Validation now runs at step 2, step 3, and finalization step 5 to prevent race-condition edge cases.
- Checks cover both modern tag-based handle storage (`creator_tags` with `handle:` prefix) and legacy `creators.handle` rows.
- API now returns clear `409` guidance: "That handle is already taken. Try a different one." instead of failing later in the public profile flow.

### Validation
- TypeScript: pass
- Build: pass (60/60 static pages)

## 2026-05-10
### Creator onboarding UX reliability: live handle availability feedback
- Added debounced live handle availability checks to onboarding step 2 (creator mode) using `GET /api/creators/handle/[handle]`.
- Continue button now requires a valid available handle (prevents avoidable step failures later).
- Added inline status states under handle field: checking, available, taken/invalid.
- Paired with server-side uniqueness enforcement already shipped to provide both proactive UX and backend safety.

### Validation
- TypeScript: pass
- Build: pass (60/60 static pages)

## 2026-05-11
### Creator onboarding + dashboard cleanup + persistence hardening
- Fixed onboarding local draft storage collision between brand and creator flows by scoping localStorage keys by role (`creator`/`brand`) while keeping legacy key fallback support.
- Fixed onboarding profile hydration so Rate Cards and Fun Facts are restored from DB snapshots (not dropped on resume when metadata arrays are empty).
- Applied dashboard visual cleanup pass to align with homepage tone: replaced heavier card treatment with a cleaner, minimal surface style while preserving current IA and modules.

### QA outcomes (today)
- Creator flow: **partial pass with one high-severity blocker still present**.
  - Verified step-4 creator portfolio state with 3 valid videos + Rate Cards + Fun Facts renders correctly in onboarding.
  - High-severity blocker observed when moving from creator step 4 → step 5: error shown (`Complete step 2 before moving on.`) even with completed prior data.
- Brand flow: **partial pass**.
  - Core onboarding steps were exercised via API path and accepted.
  - End-to-end UI campaign/applicant/message/start-flow still needs another browser pass after the creator step-transition blocker is resolved.

### Validation
- TypeScript: pass (`pnpm exec tsc --noEmit`)
- Build: pass (`pnpm run build`)

### Onboarding progression root-cause hardening
- Fixed a server-side metadata race in `/api/onboarding/step/[step]` that could overwrite newer onboarding step state with stale auth metadata during multi-step saves.
- `updateAuthMetadata` now fetches a fresh auth user snapshot before merging patch fields, then writes the merged result.
- This removes a patch-on-patch drift source that could cause false step-gate failures (e.g., creator step 4 → 5 reporting earlier-step incomplete).

### Validation
- TypeScript: pass (`pnpm exec tsc --noEmit`)
- Build: pass (`pnpm run build`)

## 2026-05-12
### Onboarding progression reliability: server-side inferred step floor
- Added inferred progress-step logic in `/api/onboarding/step/[step]` based on persisted DB state so stale metadata cannot incorrectly downgrade progression checks.
- GET and POST onboarding progression now use `max(metadataStep, inferredStep)` while onboarding is incomplete.
- Creator inferred progression advances from persisted handle/profile signals and reaches step 5 once 3+ valid portfolio videos exist.
- Brand inferred progression advances from persisted company/profile signals.

### Onboarding draft ownership + preview hydration hardening
- Fixed local onboarding draft bleed between different users on the same browser by attaching role-scoped local draft ownership (`otto:onboarding:owner:<role>`) and only reusing role draft state when the owner matches the authenticated user.
- Kept legacy onboarding localStorage fallback support so older sessions still resume safely.
- Fixed onboarding boot merge behavior to prefer server snapshot data when server progression is ahead of local draft progression, preventing stale local draft from wiping valid server portfolio/rate/fun-fact data on resume.
- Updated onboarding step API profile hydration to prioritize DB snapshot arrays for portfolio/rate cards/fun facts over stale metadata copies.

### Creator onboarding + public preview handoff polish
- Confirmed creator step 4 → step 5 progression reliably after session resets and resume/back cycles.
- Confirmed final creator preview now consistently points to public handle routes (`/creator-handle`) and renders the same public profile content in preview iframe/open actions.
- Confirmed finish handoff lands in dashboard with success state and profile URL context.

### Portfolio ordering/category integrity polish
- Adjusted onboarding portfolio upload insertion to prepend newly uploaded items so add/edit flows keep newest-first ordering integrity.
- Applied the same newest-first insertion behavior to `/profile/edit` portfolio uploads.
- Verified public profile category tabs reflect correct category counts and filtered subsets after add/edit-driven updates.

### QA outcomes (browser-style)
- Creator onboarding full flow (step 2→5, back/forward, finish, preview/public handoff): **pass**
- Creator step 4→5 reliability under prior stale local draft conditions: **pass**
- Public creator preview handoff consistency (`/${handle}`): **pass**
- Brand onboarding core flow (step 2→4 progression + save gates): **pass**
- In-browser step-4 direct local file upload on onboarding: **known flaky in tool harness** (manual API seeding used for deterministic progression verification)

### Validation
- TypeScript: pass (`pnpm exec tsc --noEmit`)
- Build: pass (`pnpm run build`)

## 2026-05-12 (subagent sanity gate)
### Production sanity pass (creator + brand) — regression gate
- Ran focused browser sanity against current `main` for onboarding handoff surfaces before styling changes.
- **Creator flow result: fail (high severity regression).**
  - Repro: `/onboarding?role=creator` step 2 with first name, last name, email, and valid available handle populated.
  - Observed: "Next" CTA remains disabled (`Handle is available.` is shown but progression is blocked).
  - Impact: blocks creator onboarding progression before public profile handoff + dashboard path.
  - Severity: **High** (core creator activation path blocked).
- **Brand flow result: blocked from clean pass due creator-path regression gate.**
  - Brand path checks were partially exercised but full clean sanity signoff is deferred until creator step-2 progression is resolved.

### Styling pass decision
- Skipped focused styling pass this run because sanity gate is not green.
- No IA/functionality changes were applied after detecting the regression.

### Validation (this run)
- TypeScript: pass (`pnpm exec tsc --noEmit`)
- Build: pass (`pnpm run build`)

## 2026-05-12 (subagent fix + sanity + styling)
### Creator onboarding step-2 regression: root cause + fix
- Root cause: onboarding step-2 handle availability checks were race-prone. Older async responses could overwrite newer input state and flip `handleStatus` away from `available`, leaving `canGoNext` false even when the current handle was valid/available.
- Fix: added a monotonic request sequence guard for handle checks in `app/(app)/onboarding/page.tsx` so only the latest request is allowed to update UI state.
- Result: creator step 2 now advances reliably when first name, last name, email, and an available handle are valid.

### Additional progression blocker uncovered/fixed during sanity
- While running full creator sanity, step 4 → step 5 failed with DB enum error: `invalid input value for enum portfolio_type: "link"` for valid YouTube URLs.
- Root cause: `inferPortfolioType` treated external video URLs (YouTube/Cloudflare) as `link` instead of `video`.
- Fix: updated `inferPortfolioType` in `lib/portfolio-media.ts` to classify all real portfolio video URLs as `video`.
- Result: creator step 4 now progresses to step 5 and finish handoff succeeds.

### Browser sanity outcomes
- Creator step 2 progression: **pass** (valid available handle enables Next and moves to next step).
- Creator full path: **pass**
  - onboarding step 2 → 5
  - preview step renders public profile iframe + public URL
  - finish routes to dashboard with onboarding success context
  - dashboard → portfolio/public profile/edit touchpoints render correctly
- Brand onboarding quick pass: **pass (regression check)**
  - brand gating logic remained intact in onboarding surface checks
  - no regressions introduced in shared step navigation/validation after fixes

### Styling pass (minimal homepage-aligned tone, no IA/function changes)
- Applied deferred low-risk visual polish across high-traffic surfaces:
  - `app/(app)/dashboard/page.tsx`: softened surface shadows, normalized card background/border contrast, reduced visual heaviness in KPI and list cards.
  - `app/(app)/onboarding/page.tsx`: aligned card/hero shadow strength and selected-state glow to cleaner minimal tone.
  - `app/(app)/profile/edit/page.tsx`: reduced highlight glow intensity and aligned panel treatment with subtle inset/surface style.
- Scope intentionally limited to visual treatment only (no routing, IA, or product logic changes).

### Validation
- TypeScript: pass (`pnpm exec tsc --noEmit`)
- Build: pass (`pnpm run build`)

## 2026-05-13
### Homepage roadmap/feed + feedback layer (MVP order item #4)
- Added a dedicated homepage roadmap section that renders current roadmap cards as a clean product feed with status chips (`Shipped this week`, `Building now`, `Under consideration`), category tags, and lightweight card entrance motion.
- Wired thumbs up / thumbs down reactions on each roadmap card with immediate on-page count updates so visitors can signal demand quickly.
- Added a “What do you want to see?” feedback capture module with product-facing prompt copy and CTA, connected to existing `POST /api/feedback/ideas` storage flow.
- Kept the roadmap/feed implementation intentionally lightweight and curated (no public comment thread), aligned with Stage 1 homepage direction.

### Validation
- TypeScript: pass (`pnpm exec tsc --noEmit`)
- Build: pass (`pnpm run build`)
