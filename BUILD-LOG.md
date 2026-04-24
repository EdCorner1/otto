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
