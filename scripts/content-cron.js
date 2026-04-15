#!/usr/bin/env node
/**
 * Otto Content Cron
 * Reads content-calendar.md, drafts posts via Copywriting Pro framework,
 * inserts into Supabase as drafts (status: draft), staggered 10/day max.
 *
 * Usage: node content-cron.js [options]
 *   --dry-run   Preview posts without inserting
 *   --force     Ignore 10/day limit
 *   --days N    Generate N days worth of posts (default: 2)
 */

const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

// ── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://vcoeayvzuranirnxavwn.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SB_SERVICE_ROLE ||
  '';
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ottougc.com';
const CRON_LOG     = '/home/node/.openclaw/workspace/otto-app/.cron-log.json';

const MAX_POSTS_PER_RUN = 10;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE   = process.argv.includes('--force');
const DAYS    = parseInt(process.argv.find(a => a.startsWith('--days'))?.split('=')[1] || '2');

// ── Helpers ─────────────────────────────────────────────────────────────────
function sbFetch(endpoint, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  return fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(body ? { 'Prefer': 'return=representation' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(r => r.json());
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPostCountToday() {
  const today = new Date().toISOString().split('T')[0];
  const data = await sbFetch(
    `blog_posts?created_at=gt.${today}T00:00:00&select=id`
  );
  return Array.isArray(data) ? data.length : 0;
}

async function insertPost(post) {
  return sbFetch('blog_posts', 'POST', post);
}

function log(msg) {
  console.log(`[content-cron] ${new Date().toISOString()} ${msg}`);
}

// ── Post content ─────────────────────────────────────────────────────────────

const POSTS_30 = [
  // Week 1
  {
    pillar: 'UGC Foundations',
    title: 'What UGC Actually Is (And What It\'s Not)',
    slug: 'what-ugc-actually-is',
    category: 'UGC Foundations',
    excerpt: 'Most people get UGC wrong before they even start. Here\'s the difference between what brands actually pay for and what most creators think they\'re selling.',
    tags: ['ugc', 'beginner', 'fundamentals'],
    content: `## What UGC Actually Is (And What It's Not)

Let's start with the most important distinction in UGC — and most people get it backwards.

UGC is not content creation. It's not filmmaking. It's not building a personal brand on TikTok or Instagram for the sake of views.

UGC is **performance-for-hire**. You are being paid to embody a product in a way that feels authentic, relatable, and buyable. The brand owns the result. You deliver the thing. That's the deal.

Most people who fail in UGC do so because they approach it as a creator first. They worry about aesthetics, cinematic transitions, their personal aesthetic. They spend three hours editing a 15-second reel that a brand will use once and never think about again.

The creators who actually make money in UGC understand something different: **the brand is buying trust, not content.**

When a brand pays you to make a UGC video, they're buying access to your credibility with an audience you've already built. The content is just the vessel.

## What UGC Is Not

- **It's not influencer marketing.** Influencers sell themselves and hope the brand rides along. UGC creators sell the product and let their persona be the delivery mechanism.
- **It's not viral content.** Your job isn't to get 2 million views. Your job is to make one person watching feel like they need this thing.
- **It's not about your follower count.** This is the biggest misconception in the space. I landed my first paid brand deal with under 400 followers. The brand didn't care about my audience size. They cared that I could make content that spoke directly to the type of buyer they were targeting.

## What UGC Actually Is

Here's the short version: UGC is being paid to make content that looks like you found a product, tried it, and loved it — when in fact you were briefed, paid, and directed by the brand.

That's not being fake. That's the job.

The brands want content that doesn't look like advertising. Real people, real reactions, real use cases. The reason UGC works is precisely because it's designed to feel like word-of-mouth from someone you kind of trust.

Your job is to make that feel effortless. That's the skill. And it's a skill most creators underestimate completely.

## The Two Frameworks That Matter

Before you film anything or send a single DM, internalize these:

**Framework 1: Trust Transfer**
Your audience trusts you. A brand wants to borrow that trust to sell their product. That's the transaction. Everything you do in UGC is about making that trust transfer as smooth as possible.

**Framework 2: Problem-Solution-Result**
The most effective UGC structure: show the problem you had (relatable), show the product solving it (natural), show the result you got (specific).

Most viral UGC videos follow this without you even noticing. It's not a template — it's psychology.

## Ready to Start?

If you're coming from a place of zero clients, the next question isn't "what should I film?" It's "who am I helping and what do they already want?"

The brands that pay well — and pay reliably — are the ones selling to people who already have a problem your content can credibly address.

That's where you start looking. Not on hashtag hunts. Not on follower growth strategies. On the specific intersection of your lived experience and a real buying audience.

We'll get into finding those brands in the next post.`
  },
  {
    pillar: 'UGC Foundations',
    title: 'The Two Skills That Make or Break a UGC Career',
    slug: 'two-skills-that-make-or-break-a-ugc-career',
    category: 'UGC Foundations',
    excerpt: 'You don\'t need to be a great filmmaker. You don\'t need to be a sales genius. But there are exactly two things you must be good at. Everything else is secondary.',
    tags: ['ugc', 'skills', 'fundamentals'],
    content: `## The Two Skills That Make or Break a UGC Career

I'm going to be direct because this matters more than anything else in this newsletter:

You don't need to be a great filmmaker.
You don't need to be a natural on camera.
You don't need a expensive setup.

You need to be good at exactly two things.

**1. You need to understand what makes someone stop scrolling and buy something.**
**2. You need to be easy to work with.**

That's it. Everything else is secondary.

## Skill 1: Understanding the Psychology of a Scroll-Stop

The entire commercial value of UGC comes down to one moment: does this content make someone feel something that leads to a purchase?

Not a like. Not a comment. A purchase.

Most creators treat UGC like content. They think about aesthetics, pacing, lighting, transitions. That's the wrong frame entirely.

The brands that pay recurring rates to UGC creators aren't paying for art. They're paying for a conversion mechanism. Your content has to do a job: move someone from "interested" to "I'm buying this."

Here's the uncomfortable truth about that: you can learn everything about UGC production — lighting, sound, editing — and still fail if you don't understand the psychology of the buy decision.

**What actually stops a scroll:**

- **Specificity over generality.** "I tried this serum and my skin looked better" doesn't convert. "Three days after using this, my hormonal acne went from cystic to almost gone — and I've tried everything" does. Specific details create believability. Believability creates trust. Trust creates purchases.

- **Relatable struggle first.** The fastest path to a buy decision is someone watching and thinking "that's exactly me." Start with the problem your audience already has, not the product you want them to discover.

- **Specific outcomes with real context.** "I saved $200 a month" is better than "it's affordable." "I can finally take my kids to school in the morning without back pain" is better than "it supports your back." Real context makes the result tangible.

- **Visual proof of the transformation.** Before/after is overdone. But showing the moment of use — genuinely using the product, not performing using the product — is still the most effective UGC format. Brands know this. That's why they pay for it.

**The creator who understands this** doesn't need perfect lighting. They don't need a $2,000 camera. They need to understand what makes their specific audience tick and how to translate that into a 15-second video that feels like a recommendation from a friend.

## Skill 2: Being Easy to Work With

This one is criminally underrated and almost nobody talks about it.

The creators who get repeat deals, higher rates, and better briefs are not always the most talented filmmakers. They're the ones who are genuinely pleasant to work with.

Specifically:

- **They respond quickly.** Brands are running campaigns with launch dates. If you're slow to respond, you're an operational liability.

- **They deliver on time or early.** Not "pretty close to the deadline." On time or early. Every time.

- **They ask good questions before filming.** The brief is the starting point, not the entire scope. Asking "what does success look like for this campaign?" and "what's the one thing you most want viewers to take away?" before you film separates professionals from amateurs.

- **They handle feedback without defensiveness.** Revision requests are not personal criticism. They're part of the job. Respond professionally, deliver promptly, move on.

- **They make the brand look good.** This sounds obvious. It isn't. Most creators treat brand deals as transactions: I made the content, I delivered it, I'm done. The creators who become irreplaceable think about what happens after delivery. Did the content perform well? What could be improved next time? How can I set up the brand to succeed with this?

The brand's success is your success. When their campaign lands, you're the person they call for the next one.

## The Combination Is Rare

Here's the frustrating part: most creators have one or the other.

You have creators who understand the psychology deeply but are impossible to work with. They get one deal, maybe two, and then the brand moves on.

You have creators who are delightful to be around and deliver on time but don't really understand why their content converts. They get repeat business at low rates because they're reliable, but they never quite break through.

The creators who build real UGC careers — the ones making $3K, $5K, $10K a month — have both skills. They've studied what makes content sell. And they've figured out how to be the person a brand wants to work with again and again.

If you're starting from zero, pick one to focus on first. I'd suggest the psychology of conversion — it's harder to learn and harder to fake, which means it's your long-term competitive advantage.

But never neglect the second skill. It's the reason many UGC creators flame out after a few months while others build multi-year careers with the same small set of brands.

Both matter.`
  },
  {
    pillar: 'UGC Foundations',
    title: 'Your First Portfolio: 6 Posts That Actually Get Clients',
    slug: 'first-portfolio-6-posts-that-get-clients',
    category: 'UGC Foundations',
    excerpt: 'Your portfolio isn\'t a highlight reel of your best work. It\'s a sales tool designed to answer one question from one specific person. Here\'s how to build one that does that.',
    tags: ['portfolio', 'beginner', 'ugc'],
    content: `## Your First Portfolio: 6 Posts That Actually Get Clients

Most UGC portfolios are built backwards.

Creators fill them with their best content — their most polished, best lit, most cinematically impressive work. They think brands want to see what the creator can do at their peak.

Brands want to see something different. They want to see what you can do for **them.**

There's a meaningful difference between a portfolio that looks impressive and a portfolio that gets you hired. This post is about the second one.

## The Portfolio Mindset Shift

Before I give you the six posts, you need to internalize this:

**Your portfolio is not a showcase. It's a sales tool.**

Every piece of content in it should answer one question from one specific person: "Can this person make content that sells my product to people like my customers?"

Everything else is noise.

When you approach your portfolio as a sales tool, the selection criteria changes completely. You're not asking "is this my best work?" You're asking:

- Does this speak to a specific audience a brand is trying to reach?
- Does this show a relatable problem → solution → result arc?
- Is the product clearly the hero of this story?
- Does this look like something a real person made, not a production team?

## The Six Posts Every New UGC Portfolio Needs

**Post 1: The Product-First Demo**
Pick a product you genuinely use and love. Film it being used — not performed, actually used. Show it in your hand, in your space, in your morning routine. The content should feel like you're showing it to a friend.

Key elements: Product is clearly visible and identified. You use it in a context that feels natural. You mention one specific thing you like about it. No jump cuts every two seconds.

This is your baseline. If a brand can't picture you making content like this, nothing else matters.

**Post 2: The Problem Acknowledgement**
This one is counterintuitive — you show the problem before you show the product.

Film yourself acknowledging a frustration, limitation, or problem you have. Then, without a hard cut, move into the product solving it.

Example structure: "I've been struggling with [problem] for [timeframe]. I finally tried [product], and [specific result]."

This is the format brands are buying when they pay for UGC. They want the before-feeling, then the solution, then the transformed feeling.

**Post 3: The Unboxing (Done Right)**
Unboxings work because they create anticipation and reveal. The key is not making it feel like an unboxing — make it feel like you're opening something you've been excited about.

Show the package arriving (or pull it from somewhere in your space). Open it with genuine curiosity. Show the product clearly. Your reaction to seeing it for the first time is the content.

This format is especially effective for physical products but can be adapted for digital products, software, courses.

**Post 4: The Comparison/Alternative**
Show a before/after or a "this vs. that" in a way that's relatable and low-pressure. Not attacking alternatives — just positioning your chosen product as the one that worked for you.

Example: "I used to use [alternative] for [use case]. It was fine, but [specific limitation]. Then I switched to [product] and [specific improvement]."

This format works because it creates context and contrast without feeling like an advertisement.

**Post 5: The Tutorial/How-To**
Show how to use a product in a way that delivers genuine value and implicitly sells it. Not "here's how you use this" — more like "here's the right way to do [thing the product does]" with the product being central to the demonstration.

This format is powerful because it establishes expertise, delivers value, and positions you as someone who knows what they're talking about. Brands notice creators who can teach as well as perform.

**Post 6: The Result Close-Up**
This one is pure psychology. Show the result of using the product in a way that's visually compelling and emotionally satisfying.

If it's a physical product: show the outcome. If it's a digital product: show the output, the interface, the moment of success. If it's a service: show the before/after state.

The key is specificity. Not "my skin looked better." Show your skin. Not "my workflow improved." Show the workflow.

## Technical Minimums

You don't need expensive equipment. But you do need:

- **Consistent vertical video format** (9:16 or 4:5 depending on platform)
- **Readable audio** — external microphone under $50 is the single best investment you can make
- **Good lighting** — ring lights work fine, natural light is free, just avoid looking like you're filming in a cave
- **Clean framing** — product is visible, face is well lit, background is not distracting

That's it. No cinema cameras. No DaVinci Resolve color grades. Just consistent, watchable, product-forward content.

## How Many Posts Do You Actually Need?

You need at least 6 before you start pitching. That's the number brands typically want to see minimum on a creator's page or portfolio before they'll consider reaching out.

More is better, but quality beats quantity. A portfolio of 6 strong posts beats a portfolio of 20 mediocre ones every time.

Start with 6. Add more as you create for real brands. Your portfolio should be a living document, not a static showcase.`
  },
];

// Deduplicate — we already have 3 posts defined above
const ALL_POSTS = POSTS_30;

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    log('DRY RUN — no posts will be inserted');
  }

  if (!SUPABASE_KEY && !DRY_RUN) {
    log('ERROR: Supabase service key env var not set (checked SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, SB_SERVICE_ROLE)');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  let logData = {};
  try {
    if (fs.existsSync(CRON_LOG)) {
      logData = JSON.parse(fs.readFileSync(CRON_LOG, 'utf8'));
    }
  } catch (e) { /* ignore */ }

  const todayCount = (logData[today] || []).length;

  if (todayCount >= MAX_POSTS_PER_RUN && !FORCE) {
    log(`Daily limit reached (${todayCount}/${MAX_POSTS_PER_RUN}). Run with --force to override.`);
    process.exit(0);
  }

  const slotsAvailable = MAX_POSTS_PER_RUN - todayCount;
  const postsToRun = ALL_POSTS.slice(0, Math.min(slotsAvailable, DAYS * 3));

  if (postsToRun.length === 0) {
    log('No posts to run.');
    process.exit(0);
  }

  log(`Running ${postsToRun.length} post(s) (today: ${todayCount}/${MAX_POSTS_PER_RUN})`);

  for (let i = 0; i < postsToRun.length; i++) {
    const p = postsToRun[i];
    log(`  Drafting: "${p.title}"`);
    let insertedOk = false;

    if (DRY_RUN) {
      console.log(`\n=== DRY RUN: ${p.title} ===`);
      console.log(p.content.substring(0, 200) + '...\n');
    } else {
      // Stagger inserts by 2 seconds to avoid rate issues
      await sleep(2000);

      const result = await insertPost({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        tags: p.tags,
        status: 'draft',
        author_name: 'Otto',
        category_id: null,
        cover_image_url: null,
        published_at: null,
        created_by: '8300acaa-a87d-45ff-af41-5a8c1b1a0704', // content-cron auth user
      });

      // Result is an array when using Prefer: return=representation
      const inserted = Array.isArray(result) ? result[0] : result;

      if (inserted?.id) {
        insertedOk = true;
        log(`  Inserted: ${inserted.id}`);
      } else if (result?.code === '23505') {
        log(`  Skipped (slug exists): ${p.slug}`);
      } else {
        log(`  Insert failed: ${JSON.stringify(result)}`);
      }
    }

    // Update log only on successful inserts
    if (!DRY_RUN && insertedOk) {
      if (!logData[today]) logData[today] = [];
      logData[today].push({ title: p.title, slug: p.slug, at: new Date().toISOString() });
      fs.writeFileSync(CRON_LOG, JSON.stringify(logData, null, 2));
    }
  }

  log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
