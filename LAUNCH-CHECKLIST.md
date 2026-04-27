# Otto Launch Checklist

_Last updated: 2026-04-27_

Goal: get Otto ready to promote publicly by the end of this week.

Canonical domain: **https://ottougc.com**

---

## Launch bar

Otto is launch-ready when:
- a new creator can sign up and publish a credible profile without help
- a brand can understand the product and evaluate a creator quickly
- auth/onboarding/profile flows work reliably on live
- the site looks polished enough to survive first impressions from promoted traffic
- core ops are in place so breakage is visible quickly

---

## P0 — Must be done before promotion

### 1) Creator onboarding works end to end
- [ ] Email signup → creator onboarding works on live
- [ ] Google signup → creator onboarding works on live
- [ ] Existing user login correctly resumes onboarding
- [ ] Auth callback returns users to the correct onboarding step
- [ ] Progress persists between refreshes / session resumes
- [ ] Creator can complete onboarding without manual intervention
- [ ] Post-onboarding redirect lands in the right dashboard state

### 2) Portfolio flow is reliable
- [ ] Creator can upload valid videos without broken states
- [ ] Remove/replace video flow works
- [ ] Minimum quality gate is consistent everywhere in product copy and logic
- [ ] Captions / portfolio metadata save correctly
- [ ] Public profile shows uploaded portfolio correctly
- [ ] Empty/error states feel intentional, not broken

### 3) Public creator profile is promotion-ready
- [ ] Public profile loads cleanly on desktop
- [ ] Public profile loads cleanly on mobile
- [ ] Hero / bio / CTA / trust sections feel polished
- [ ] Portfolio category filtering works correctly
- [ ] Video embeds / thumbnails / links render correctly
- [ ] Page gives brands a fast read in under 10 seconds
- [ ] No obviously rough or placeholder copy

### 4) Homepage and conversion entrypoints are clear
- [ ] Homepage creator CTA goes to `https://ottougc.com/signup?role=creator`
- [ ] Homepage brand CTA goes to `https://ottougc.com/signup?role=brand`
- [ ] Signup page clearly supports Google + email
- [ ] Waitlist / early access language is consistent
- [ ] Homepage explains Otto clearly in one pass
- [ ] Mobile homepage feels strong enough to share publicly

### 5) Live QA / smoke test
- [ ] Homepage renders correctly on live
- [ ] Signup/login/auth callback work on live
- [ ] Dashboard loads after onboarding
- [ ] Public creator profile is generated and reachable
- [ ] Brand-facing creator review page works
- [ ] No critical console/runtime errors during core flow
- [ ] No broken buttons or dead-end routes in main flow

---

## P1 — Should be done this week if possible

### 6) Trust and product confidence
- [ ] Add/verify a simple support contact path
- [ ] Ensure social proof / trust framing is visible near primary CTAs
- [ ] Review awkward AI-sounding or overly gimmicky copy across main surfaces
- [ ] Confirm canonical domain + redirects are correct everywhere

### 7) Monitoring / ops basics
- [ ] Error tracking in place (Sentry or equivalent)
- [ ] Basic product analytics on key conversion events
- [ ] Health check script reflects canonical domain (`ottougc.com`)
- [ ] Cron reliability issue investigated and fixed or intentionally disabled from launch-critical path

### 8) Product clarity / scope control
- [ ] Decide the final creator quality bar and keep messaging consistent everywhere
- [ ] Remove any leftover conflicting roadmap/product copy
- [ ] Freeze net-new experiments until the launch flow is stable

---

## P2 — Nice to have, not launch blockers

### 9) Post-launch quality upgrades
- [ ] Homepage roadmap/feed V1 polish
- [ ] Feedback capture section
- [ ] More creator trust signals / proof points
- [ ] More advanced brand evaluation tools
- [ ] Cron/content automation improvements beyond reliability

---

## This week execution order

### Day 1 — Stability + test path
- [ ] Finalize launch checklist
- [ ] Test creator onboarding flow live end to end
- [ ] Confirm friend tester entry link
- [ ] Fix any onboarding/auth redirect issues immediately

### Day 2 — Profile + portfolio polish
- [ ] QA public creator profile on mobile and desktop
- [ ] Fix any weak/rough sections in public profile
- [ ] Check portfolio upload/remove/replace flows on live

### Day 3 — Homepage + conversion path
- [ ] Verify homepage CTA path for creator and brand
- [ ] Tighten headline / CTA / trust framing where needed
- [ ] Run a full smoke test from homepage to live creator profile

### Day 4 — Ops + launch readiness
- [ ] Fix canonical-domain health checks
- [ ] Investigate/fix cron reliability issue
- [ ] Add/verify analytics + error monitoring if missing
- [ ] Final launch/no-launch decision

---

## Current known issues / follow-up
- [ ] Evening content cron appears inactive (`.cron-log.json` has no recent entries beyond 2026-04-13)
- [ ] Daily health script still references legacy host paths and should be updated to reflect canonical production domain
- [ ] Product messaging has had recent 3-video vs 6-video inconsistencies and needs one final source of truth

---

## Friend tester links

### New creator tester
- `https://ottougc.com/signup?role=creator`

### New brand tester
- `https://ottougc.com/signup?role=brand`

### Existing signed-in creator direct onboarding entry
- `https://ottougc.com/onboarding?role=creator`

---

## Launch recommendation

Best immediate goal: **private beta / promoted friend-test by end of week**

That means:
- stable creator signup + onboarding
- polished public profile
- clear homepage CTA path
- no major auth or routing breakage
- enough confidence to send real traffic without embarrassment
