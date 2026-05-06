import Link from 'next/link'

const DAYS = [
  { day: 1, title: 'Day 1: Your First UGC Profile That Brands Actually Want to See', slug: 'day-1-first-ugc-profile', teaser: 'Most creator profiles look the same. Here is how to build one that makes brands stop scrolling.' },
  { day: 2, title: 'Day 2: Finding Your First Deal (Without Going Viral)', slug: 'day-2-finding-first-deal', teaser: 'You do not need 100K followers. You need one brand that says yes.' },
  { day: 3, title: 'Day 3: How to Write a Pitch That Gets a Response', slug: 'day-3-write-pitch-that-gets-response', teaser: 'Most cold DMs get ignored. Here is what a winning pitch looks like.' },
  { day: 4, title: 'Day 4: Setting Your Rate (And Sticking to It)', slug: 'day-4-setting-your-rate', teaser: 'The number most new creators undercharge by — and how to fix it.' },
  { day: 5, title: 'Day 5: The Legal Stuff Brands Will Ask For', slug: 'day-5-legal-stuff', teaser: 'Contracts, usage rights, and what you actually need before you start.' },
  { day: 6, title: 'Day 6: Building a Portfolio Page That Converts', slug: 'day-6-portfolio-page-that-converts', teaser: 'Your TikTok grid is not a portfolio. Here is what a brand-ready one looks like.' },
  { day: 7, title: 'Day 7: Landing Your First £200 Deal (And Why It Matters)', slug: 'day-7-first-200-deal', teaser: 'The first deal is not about the money. It is about the testimonial.' },
  { day: 8, title: 'Day 8: Turning One Deal Into Three', slug: 'day-8-one-deal-into-three', teaser: 'How to ask for referrals without feeling weird about it.' },
  { day: 9, title: 'Day 9: The Content Stack You Actually Need', slug: 'day-9-content-stack-you-need', teaser: 'No sponsored links. The exact tools that save hours per week.' },
  { day: 10, title: 'Day 10: Creating Your First Piece of UGC Content', slug: 'day-10-first-piece-of-ugc-content', teaser: 'From brief to finished — the workflow I still use today.' },
  { day: 11, title: 'Day 11: Understanding What Brands Actually Want', slug: 'day-11-what-brands-actually-want', teaser: "It is not views. Here is what actually matters to a brand's marketing team." },
  { day: 12, title: 'Day 12: Pricing Your Second and Third Deal', slug: 'day-12-pricing-second-third-deal', teaser: 'Your first deal was for experience. These ones are for profit.' },
  { day: 13, title: 'Day 13: Building Relationships With Brands', slug: 'day-13-building-brand-relationships', teaser: 'The creators earning £4K/month are not chasing new clients. Here is why.' },
  { day: 14, title: 'Day 14: What to Do When a Brand Says No', slug: 'day-14-when-brand-says-no', teaser: 'Most creators give up here. Here is what to do instead.' },
  { day: 15, title: 'Day 15: Getting Your First Retainer Client', slug: 'day-15-first-retainer-client', teaser: 'One retainer changes everything about how you think about this as a business.' },
  { day: 16, title: 'Day 16: Your First £1,000 Month', slug: 'day-16-first-1000-month', teaser: 'The milestone that changes how you think about UGC as a career.' },
  { day: 17, title: 'Day 17: Understanding Your Numbers', slug: 'day-17-understanding-your-numbers', teaser: 'Revenue is vanity. Profit is sanity. Here is what to track.' },
  { day: 18, title: 'Day 18: Saying No to Bad Deals', slug: 'day-18-saying-no-to-bad-deals', teaser: 'The most profitable thing you will do this month is decline a deal.' },
  { day: 19, title: 'Day 19: Creating a Content System That Scales', slug: 'day-19-content-system-that-scales', teaser: 'Batch filming, templates, and the workflow that lets you work less.' },
  { day: 20, title: 'Day 20: How to Use AI Without Sounding Like AI', slug: 'day-20-using-ai-without-sounding-like-ai', teaser: 'The tools that save 10+ hours a week — and how to keep your voice.' },
  { day: 21, title: 'Day 21: Building Your Email List From Day Zero', slug: 'day-21-building-email-list-day-zero', teaser: 'Every creator in 2026 needs an email list. Here is how to start.' },
  { day: 22, title: 'Day 22: Your First Recurring Brand Relationship', slug: 'day-22-first-recurring-brand-relationship', teaser: 'How to turn a one-off deal into a monthly retainer.' },
  { day: 23, title: 'Day 23: Networking With Other Creators', slug: 'day-23-networking-with-other-creators', teaser: 'It is not networking. It is having peers who send you work.' },
  { day: 24, title: 'Day 24: Expanding to a Second Platform', slug: 'day-24-expanding-to-second-platform', teaser: 'Why most creators should be on LinkedIn — and how to start.' },
  { day: 25, title: 'Day 25: Protecting Yourself and Your Work', slug: 'day-25-protecting-yourself-and-work', teaser: 'Contracts, copyright, and the red flags to watch for.' },
  { day: 26, title: 'Day 26: Raising Your Rates', slug: 'day-26-raising-your-rates', teaser: 'When to raise, how much, and how to tell your existing clients.' },
  { day: 27, title: 'Day 27: Your First £3,000 Month', slug: 'day-27-first-3000-month', teaser: 'The milestone that makes UGC feel like a real business.' },
  { day: 28, title: 'Day 28: Building a Signup of Brands', slug: 'day-28-building-brand-demand', teaser: 'How to be in a position where brands come to you.' },
  { day: 29, title: 'Day 29: Planning Your Next 90 Days', slug: 'day-29-planning-next-90-days', teaser: 'From £0 to £1,000 was the start. Here is what the next 90 days look like.' },
  { day: 30, title: 'Day 30: Where to Go From Here', slug: 'day-30-where-to-go-from-here', teaser: 'The path from £1,000 to £10,000 a month — and what actually comes next.' },
]

export default function SeriesPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/blog" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Blog</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-[860px] mx-auto px-6 pt-32 pb-20">

        {/* Series header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-[#ccff00] text-[#1c1c1c] px-3 py-1 rounded-full uppercase tracking-wide">Free Series</span>
            <span className="text-xs text-[#9a9a9a]">30 Days</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1.05, letterSpacing: '-3px', color: '#1c1c1e' }} className="mb-4">
            $0 to £1,000 in 30 Days
          </h1>
          <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '18px', lineHeight: 1.6, color: '#6b6b6b' }} className="max-w-xl mb-6">
            A practical, day-by-day guide to earning your first £1,000 as a tech UGC creator. No fluff. No guru speak. Just the exact steps.
          </p>

          <div className="flex items-center gap-4 text-sm text-[#9a9a9a]">
            <span>30 posts</span>
            <span>·</span>
            <span>Tech UGC + Creator Economy</span>
            <span>·</span>
            <span>Created by Otto</span>
          </div>
        </div>

        {/* Why this series */}
        <div className="bg-white border border-[#e8e8e4] rounded-2xl p-7 mb-10">
          <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }} className="mb-3">Why this series exists</h2>
          <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '15px', lineHeight: 1.7, color: '#6b6b6b' }}>
            Most UGC advice is written for people who already have an audience. This series is for the creator with zero deals, zero followers, and zero idea where to start. We start from £0. We end at £1,000. Every step is one that actually works.
          </p>
        </div>

        {/* Days list */}
        <div className="space-y-2">
          {DAYS.map(({ day, title, slug, teaser }) => (
            <Link key={day} href={`/blog/${slug}`}
              className="group flex items-start gap-4 p-4 bg-white border border-[#e8e8e4] rounded-xl hover:border-[#ccff00] hover:-translate-y-0.5 hover:shadow-md transition-all">

              {/* Day number */}
              <div className="w-10 h-10 rounded-xl bg-[#f0f0ec] flex items-center justify-center text-sm font-bold text-[#363535] flex-shrink-0 group-hover:bg-[#ccff00] transition-colors">
                {day}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.5px', color: '#363535' }} className="group-hover:text-[#1c1c1e] transition-colors">
                  {title}
                </p>
                <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>{teaser}</p>
              </div>

              <div className="text-[#9a9a9a] group-hover:text-[#363535] transition-colors text-sm mt-1">→</div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 bg-[#1c1c1c] rounded-2xl text-center">
          <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '26px', letterSpacing: '-2px', color: '#fff' }} className="mb-2">
            Want early access to everything?
          </h2>
          <p className="text-white/50 text-sm mb-6">Join the Otto signup — get notified as each post drops.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-[#1c1c1c] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors">
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  )
}
