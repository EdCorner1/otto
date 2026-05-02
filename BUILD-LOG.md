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
