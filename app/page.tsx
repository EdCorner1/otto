import Link from 'next/link'
import HomeAuthCtas from './HomeAuthCtas'

const HERO_VIDEOS = [
  {
    src: 'https://edcorner.co.uk/wp-content/uploads/2026/03/d7c359c0cf243f029082205768b75922-1.mp4',
    title: 'Tech UGC',
  },
  {
    src: 'https://edcorner.co.uk/wp-content/uploads/2026/02/Video-1-with-captions.mp4',
    title: 'App Demo',
  },
  {
    src: 'https://edcorner.co.uk/wp-content/uploads/2026/02/video-2-with-captions.mp4',
    title: 'Creator Review',
  },
]

const IconBrief = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const IconMatch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconShip = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
)

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ─── FLOATING NAV ─────────────────────────────────── */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 md:px-6 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <HomeAuthCtas />
      </nav>

      {/* ─── HERO — full first screen ─────────────────────── */}
      <section className="min-h-screen flex flex-col justify-center pt-20 pb-10 px-6 md:px-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center flex-1 py-8">

          {/* LEFT: Content */}
          <div>
            {/* Badge */}
            <div className="fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ccff00] mb-7">
              <span className="text-xs font-semibold text-[#1c1c1c] tracking-wide">For tech brands & creators</span>
            </div>

            {/* Headline — exact match to Ed's site */}
            <h1 className="fade-up stagger-1" style={{ fontSize: 'clamp(48px, 7vw, 84px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
              The UGC marketplace<br />
              for tech brands<br />
              &amp; creators
            </h1>

            {/* Subline */}
            <p className="fade-up stagger-2 text-[#6b6b6b] text-base md:text-lg leading-relaxed mb-6 max-w-sm">
              Post a brief. Get matched with vetted creators. Ship content in days, not weeks.
            </p>

            {/* Credibility */}
            <div className="fade-up stagger-3 mb-7">
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-[#e8e8e4] rounded-xl shadow-sm">
                <span className="text-sm font-semibold text-[#1c1c1c]">Escrow protected payments</span>
              </div>
              <p className="mt-2 text-xs text-[#9a9a9a]">
                Avg. brief fills in 48hrs · No commission until your deal closes
              </p>
            </div>

            {/* CTA */}
            <div className="fade-up stagger-4">
              <Link href="/signup" className="btn-primary text-base px-7 py-3.5 inline-flex items-center gap-2">
                Get Started
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <p className="mt-3 text-xs text-[#9a9a9a]">Free for creators. Brands pay when they post.</p>
            </div>
          </div>

          {/* RIGHT: Hero videos */}
          <div className="fade-up stagger-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-[520px] mx-auto lg:mx-0">
              {HERO_VIDEOS.map((video, index) => (
                <div
                  key={video.src}
                  className={[
                    'relative aspect-[9/16] overflow-hidden bg-[#e8e8e4] shadow-xl shadow-black/8',
                    index === 0 ? 'mt-6 rounded-[20px]' : '',
                    index === 1 ? 'rounded-[22px]' : '',
                    index === 2 ? 'hidden sm:block -mt-6 rounded-[20px]' : '',
                  ].join(' ')}
                >
                  <video
                    src={video.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold tracking-wide text-[#363535] mb-2">
                      {video.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex justify-start gap-6 mt-5">
              {[
                { num: '10%', label: 'Platform fee' },
                { num: '48hr', label: 'Avg. brief fill' },
                { num: 'Escrow', label: 'protected' },
                { num: 'No CC', label: 'required' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="text-lg font-extrabold font-display text-[#1c1c1c]">{num}</div>
                  <div className="text-xs text-[#9a9a9a]">{label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── FEATURED BRIEFS — logged-out preview ─────────────────── */}
      <section className="py-12 md:py-16 px-6 md:px-10 border-t border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ccff00] mb-4">
                <span className="text-xs font-semibold text-[#1c1c1c]">Open briefs</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-[#1c1c1e] tracking-tight leading-tight">
                Featured briefs
              </h2>
              <p className="text-sm text-[#9a9a9a] mt-1">Join to apply — new briefs posted daily</p>
            </div>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#363535] hover:text-[#1c1c1e] transition-colors"
            >
              Join Otto
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Job cards */}
          <div className="space-y-3">
            {[
              {
                brand: 'Raycon',
                initials: 'R',
                industry: 'Consumer Electronics',
                title: 'Raycon Everyday Earbuds — 3 Video Testimonials',
                desc: 'Authentic testimonial videos from everyday people sharing how Raycon fits into their commute, gym, or WFH routine.',
                platforms: ['TikTok', 'Instagram'],
                budget: '£200–400',
                time: '1d ago',
              },
              {
                brand: 'Airalo',
                initials: 'A',
                industry: 'Travel Tech',
                title: '"I used Airalo instead of roaming" Reel',
                desc: 'Share your honest experience using Airalo eSIM on a trip. Show setup vs. traditional roaming. Focus on convenience and savings.',
                platforms: ['TikTok', 'Instagram'],
                budget: '£200–500',
                time: '2d ago',
              },
              {
                brand: 'Pipo AI',
                initials: 'P',
                industry: 'AI Productivity',
                title: '"My most productive day using Pipo" Video',
                desc: 'Document a full workday using Pipo AI. Show the tool in action and your honest productivity win. Screen recording + camera overlay.',
                platforms: ['TikTok', 'YouTube'],
                budget: '£400–700',
                time: '3d ago',
              },
              {
                brand: 'Detris',
                initials: 'D',
                industry: 'Fitness Tech',
                title: 'Detris Fitness Tracker — 5-Day Challenge Series',
                desc: 'Film yourself using Detris over 5 days. Show the tracker in action, steps, heart rate, and sleep. Give honest mini-reviews each day.',
                platforms: ['TikTok', 'Instagram'],
                budget: '£500–1,000',
                time: '1d ago',
              },
              {
                brand: 'Stackra',
                initials: 'S',
                industry: 'SaaS Tools',
                title: '"Stackra replaced 3 tools I was paying for"',
                desc: 'Comparison UGC showing how Stackra consolidates your workflow. Show 3 tools you used before and how Stackra replaces them.',
                platforms: ['LinkedIn', 'TikTok'],
                budget: '£400–600',
                time: '4d ago',
              },
            ].map(({ brand, initials, industry, title, desc, platforms, budget, time }) => (
              <div key={title} className="bg-white rounded-2xl border border-[#e8e8e4] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                {/* Top row: brand + time */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-[#e8e8e4] flex items-center justify-center text-xs font-bold text-[#6b6b6b]">
                    {initials}
                  </div>
                  <span className="text-xs font-semibold text-[#363535]">{brand}</span>
                  <span className="text-xs text-[#9a9a9a]">·</span>
                  <span className="text-xs text-[#9a9a9a]">{industry}</span>
                  <span className="text-xs text-[#9a9a9a] ml-auto">{time}</span>
                </div>

                {/* Title + description */}
                <h3 className="text-sm font-semibold text-[#1c1c1e] mb-1.5 leading-tight">{title}</h3>
                <p className="text-xs text-[#6b6b6b] leading-relaxed mb-3 line-clamp-2">{desc}</p>

                {/* Platforms + budget */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1.5">
                    {platforms.map((p) => (
                      <span key={p} className="text-[11px] text-[#9a9a9a]">● {p}</span>
                    ))}
                  </div>
                  <span className="ml-auto px-2.5 py-1 bg-[#ccff00]/20 rounded-full text-[11px] font-semibold text-[#363535]">
                    {budget}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA strip */}
          <div className="mt-5 text-center">
            <p className="text-sm text-[#9a9a9a] mb-3">Login to see all briefs and apply</p>
            <Link href="/signup" className="btn-primary text-sm px-6 py-3">
              Join Otto — free for creators
            </Link>
          </div>

        </div>
      </section>

      {/* ─── WHY UGC — comparison section ─────────────────── */}
      <section className="py-16 md:py-20 px-6 md:px-10 border-t border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ccff00] mb-4">
              <span className="text-xs font-semibold text-[#1c1c1c]">Why UGC?</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-[#1c1c1e] tracking-tight leading-tight mb-4">
              The difference is<br />
              <span className="text-[#363535]">in the results</span>
            </h2>
            <p className="text-[#6b6b6b] text-base max-w-md mx-auto">
              Audiences trust creators they follow 4× more than brands. UGC turns that trust into conversions.
            </p>
          </div>

          {/* Comparison grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Traditional */}
            <div className="rounded-2xl border border-[#e8e8e4] overflow-hidden">
              <div className="px-6 py-4 bg-[#f0f0ec] border-b border-[#e8e8e4]">
                <span className="text-xs font-bold text-[#9a9a9a] uppercase tracking-widest">Traditional Ads</span>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { title: 'Expensive production', desc: 'Crew, equipment, studio time — £5k–£50k per spot' },
                  { title: 'Audiences skip or block', desc: 'Ad blockers, DVR skipping, banner blindness' },
                  { title: 'Low engagement', desc: '0.5–1% average CTR on display ads' },
                  { title: 'Feels impersonal', desc: 'Audiences know it is an ad — trust is low' },
                  { title: 'Long turnaround', desc: '4–12 weeks from brief to final delivery' },
                  { title: 'High cost per acquisition', desc: '£15–£80 CPA through paid channels' },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="inline-block w-4 h-4 rounded-full bg-[#e8e8e4] mt-1 flex-shrink-0"></span>
                    <div>
                      <p className="text-sm font-semibold text-[#363535]">{title}</p>
                      <p className="text-xs text-[#9a9a9a] mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UGC / Otto */}
            <div className="rounded-2xl border-2 border-[#1c1c1e] overflow-hidden shadow-xl shadow-black/10">
              <div className="px-6 py-4 bg-[#1c1c1e] border-b border-[#363535]">
                <span className="text-xs font-bold text-[#ccff00] uppercase tracking-widest">UGC via Otto</span>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { title: 'Creator-ready content', desc: 'Real creators, real devices — starting from £75 per piece' },
                  { title: 'Audiences engage', desc: 'UGC gets 2× more engagement than branded content' },
                  { title: '4× higher conversions', desc: 'Creators you trust = actions you take' },
                  { title: 'Authentic voice', desc: 'Content that sounds like a mate, not a sales pitch' },
                  { title: 'Ship in days', desc: 'Brief today, content in your hands within 48hrs' },
                  { title: 'Lower cost per acquisition', desc: 'Organic reach + trusted voice = better ROI' },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="inline-block w-4 h-4 rounded-full bg-[#ccff00] mt-1 flex-shrink-0"></span>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1c1e]">{title}</p>
                      <p className="text-xs text-[#6b6b6b] mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom stat strip */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stat: '4×', label: 'more trusted than branded content' },
              { stat: '2×', label: 'engagement vs traditional ads' },
              { stat: '48hrs', label: 'average time to first submission' },
              { stat: '73%', label: 'of Gen Z discovers brands via creators' },
            ].map(({ stat, label }) => (
              <div key={label} className="text-center p-4 bg-[#fafaf9] rounded-xl border border-[#e8e8e4]">
                <div className="text-2xl font-extrabold font-display text-[#1c1c1e] mb-1">{stat}</div>
                <p className="text-xs text-[#6b6b6b] leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* ─── HOW IT WORKS — short strip ────────────────────── */}
      <section className="py-12 md:py-14 px-6 md:px-10 border-t border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Post a Brief', desc: '5 minutes. Product, platforms, timeline, budget.', icon: <IconBrief /> },
              { step: '2', title: 'Get Matched', desc: 'Vetted creators apply. You pick who to work with.', icon: <IconMatch /> },
              { step: '3', title: 'Ship & Get Paid', desc: 'Content delivered. Escrow releases payment. Done.', icon: <IconShip /> },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="text-3xl font-extrabold font-display text-[#ccff00] leading-none">{step}</div>
                  <div className="w-8 h-8 rounded-lg bg-[#363535] flex items-center justify-center text-[#ccff00] mt-1">{icon}</div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1c1c1c] mb-1">{title}</h3>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 md:px-10 bg-[#1c1c1c]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Ready to work with UGC creators?
          </h2>
          <p className="text-[#6b6b6b] text-base mb-8">
            create your account. Be first when we open.
          </p>
          <Link href="/signup" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
            Join Otto Today
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="py-5 px-6 md:px-10 border-t border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-base font-extrabold font-display tracking-tight text-[#1c1c1c]">Otto</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
          </Link>
          <div className="flex items-center gap-5 text-xs text-[#9a9a9a]">
            
            <Link href="/resources" className="hover:text-[#1c1c1c] transition-colors">Resources</Link>
            <Link href="/about" className="hover:text-[#1c1c1c] transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-[#1c1c1c] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1c1c1c] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[#1c1c1c] transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-[#9a9a9a]">© 2025 Otto</p>
        </div>
      </footer>

    </div>
  )
}
