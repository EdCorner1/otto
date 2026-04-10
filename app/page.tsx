import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ─── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 backdrop-blur-md bg-[#fafaf9]/80 border-b border-[#e8e8e4]/60">
        <Link href="/" className="logo-mark">
          <span className="text-xl font-extrabold font-display tracking-tight text-[#1c1c1c]">Otto</span>
          <span className="logo-dot" />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm py-2.5 px-5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── MARQUEE TICKER ─────────────────────────────── */}
      <div className="pt-20 overflow-hidden border-b border-[#e8e8e4] bg-[#1c1c1c]">
        <div className="flex whitespace-nowrap py-3">
          <div className="animate-marquee flex items-center gap-8 text-sm text-[#6b6b6b]">
            {Array(4).fill([
              '⚡ Tech UGC Marketplace',
              '✦ Creators Who Understand Products',
              '✦ Brands Who Get Results',
              '✦ No More Cold DMs',
              '⚡ Post a Brief. Get Matched. Ship.',
              '✦ Built for Tech. Backed by Community.',
              '⚡ Tech UGC Marketplace',
              '✦ Creators Who Understand Products',
              '✦ Brands Who Get Results',
              '✦ No More Cold DMs',
              '⚡ Post a Brief. Get Matched. Ship.',
              '✦ Built for Tech. Backed by Community.',
            ]).flat().map((item, i) => (
              <span key={i} className="flex items-center gap-8">
                <span>{item}</span>
                <span className="text-[#84cc16]">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HERO ───────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 px-8 max-w-7xl mx-auto">
        
        {/* Geometric accents */}
        <div className="geo-circle w-80 h-80 -top-10 -right-20 hidden lg:block" />
        <div className="geo-circle w-48 h-48 top-40 left-1/2 hidden lg:block" />
        <div className="geo-line w-40 top-32 left-0 hidden lg:block" />
        <div className="geo-line w-24 bottom-16 right-40 hidden lg:block" />

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left column */}
          <div className="lg:col-span-7">
            
            {/* Launch badge */}
            <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#e8e8e4] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]" />
              </span>
              <span className="text-xs font-semibold text-[#6b6b6b] tracking-wide">LAUNCHING SOON</span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-150 font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] mb-8">
              <span className="text-[#1c1c1c]">The UGC marketplace</span>
              <br />
              <span className="text-[#84cc16]">for tech</span>
              <br />
              <span className="text-[#1c1c1c]">brands & creators</span>
            </h1>

            {/* Sub */}
            <p className="animate-fade-up delay-250 text-[#6b6b6b] text-lg md:text-xl leading-relaxed mb-10 max-w-lg font-light">
              Otto connects forward-thinking tech brands with vetted UGC creators. 
              Faster briefs. Better matches. Real results. No cold DMs.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-350 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary text-base px-8 py-4">
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href="/login" className="btn-ghost text-base border border-[#e8e8e4] px-6 py-4">
                Browse as Guest
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up delay-450 flex items-center gap-4 mt-10 pt-10 border-t border-[#e8e8e4]">
              <div className="flex -space-x-3">
                {['M', 'J', 'A', 'R', 'S'].map((letter, i) => (
                  <div 
                    key={i} 
                    className="w-9 h-9 rounded-full bg-[#f2fbe4] border-2 border-white flex items-center justify-center text-xs font-bold text-[#6db80f] font-display"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#6b6b6b]">
                <span className="font-semibold text-[#1c1c1c]">500+ creators</span> and{' '}
                <span className="font-semibold text-[#1c1c1c]">50 brands</span><br />
                already on the signup
              </div>
            </div>
          </div>

          {/* Right column — abstract visual */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative">
              {/* Abstract geometric composition */}
              <div className="w-full aspect-square rounded-3xl bg-[#1c1c1c] relative overflow-hidden">
                {/* Grid */}
                <div className="absolute inset-0 dot-grid opacity-20" />
                
                {/* Central text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="text-6xl mb-4">⚡</div>
                  <div className="font-display font-extrabold text-white text-2xl leading-tight mb-2">
                    Tech UGC.<br />Reimagined.
                  </div>
                  <div className="text-[#6b6b6b] text-sm font-light">
                    Gadgets. AI Tools. SaaS.
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute top-5 right-5 px-3 py-1.5 bg-[#84cc16] rounded-full text-xs font-bold text-white">
                  LIVE
                </div>
                <div className="absolute bottom-5 left-5 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-xs font-medium text-white/80">
                  500 creators waiting
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DARK BAND: STATS ────────────────────────────── */}
      <section className="bg-[#1c1c1c] py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '500+', label: 'Creators on signup' },
              { num: '50+', label: 'Brands signed up' },
              { num: '<5min', label: 'To post a brief' },
              { num: '10%', label: 'Platform fee — transparent' },
            ].map(({ num, label }, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-display text-3xl md:text-4xl font-extrabold text-white mb-1">{num}</div>
                <div className="text-sm text-[#6b6b6b]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE PROPS ─────────────────────────────────── */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Section header */}
          <div className="mb-16">
            <span className="section-label mb-4 block">Why Otto</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-[#1c1c1c] max-w-xl leading-tight">
              Built for how tech UGC actually works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡',
                title: 'For Brands',
                desc: 'Post a brief. Get proposals from vetted tech creators in hours. Hire, pay, and manage all in one place — no more hunting on LinkedIn.',
                cta: 'Post a job →',
                ctaHref: '/signup?role=brand',
                tag: 'BRANDS',
              },
              {
                icon: '🎯',
                title: 'For Creators',
                desc: 'Find briefs that actually match your niche. Do work you care about. Get paid fairly — no negotiations, no lowballing, no chasing invoices.',
                cta: 'Join free →',
                ctaHref: '/signup?role=creator',
                tag: 'CREATORS',
              },
              {
                icon: '🔗',
                title: 'Built for Tech',
                desc: 'Not another generic marketplace. Otto is built for gadgets, AI tools, SaaS, and the creators who actually understand and can demo them.',
                cta: 'Learn more →',
                ctaHref: '#',
                tag: 'TECH FOCUS',
              },
            ].map(({ icon, title, desc, cta, ctaHref, tag }, i) => (
              <div key={i} className="card card-hover flex flex-col group">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    {icon}
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-[#a0a09c] uppercase">{tag}</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{title}</h3>
                <p className="text-[#6b6b6b] text-sm leading-relaxed flex-1 mb-6">{desc}</p>
                <Link href={ctaHref} className="text-sm font-semibold text-[#84cc16] hover:text-[#6db80f] transition-colors flex items-center gap-1 group-hover:gap-2 transition-all">
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section className="py-24 px-8 bg-[#f4f4f2]">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid md:grid-cols-2 gap-16 items-start">
            
            {/* Left: sticky header */}
            <div className="md:sticky md:top-32">
              <span className="section-label mb-4 block">How it works</span>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-[#1c1c1c] leading-tight mb-6">
                From brief to content in three steps
              </h2>
              <p className="text-[#6b6b6b] leading-relaxed mb-8">
                Otto handles the messy middle — matching, communication, payment, escrow. 
                You focus on the creative.
              </p>
              <Link href="/signup" className="btn-primary text-base inline-flex items-center gap-2">
                Start for free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {/* Right: steps */}
            <div className="space-y-6">
              {[
                {
                  num: '01',
                  title: 'Post a brief',
                  desc: 'Fill out a structured brief — product, deliverables, platforms, timeline, budget. Takes under 5 minutes. Structured briefs get better proposals.',
                  detail: 'Structured. Clear. No back-and-forth.',
                },
                {
                  num: '02',
                  title: 'Creators apply',
                  desc: 'Vetted creators browse your brief and submit proposals. Review portfolios, rates, and relevance. Chat to find the right fit.',
                  detail: 'You choose. No algorithm deciding for you.',
                },
                {
                  num: '03',
                  title: 'Otto handles the rest',
                  desc: 'Once you hire, Otto holds payment in escrow until work is approved. Creator gets paid. Brand gets content. Everyone wins.',
                  detail: 'Escrow protection. Dispute resolution. Built in.',
                },
              ].map(({ num, title, desc, detail }, i) => (
                <div key={i} className="bg-white rounded-3xl p-8 border border-[#e8e8e4]">
                  <div className="flex items-start gap-6">
                    <div className="font-display text-5xl font-extrabold text-[#84cc16]/20 leading-none flex-shrink-0 w-16">
                      {num}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
                      <p className="text-[#6b6b6b] text-sm leading-relaxed mb-3">{desc}</p>
                      <p className="text-xs font-semibold text-[#a0a09c] tracking-wide uppercase">{detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────── */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto text-center">
          
          <span className="section-label mb-4 block">Pricing</span>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-[#1c1c1c] mb-4">
            Simple. Transparent.
          </h2>
          <p className="text-[#6b6b6b] text-lg font-light mb-14">
            No hidden fees. No surprise cuts. Just honest pricing.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            
            {/* Brands */}
            <div className="card">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-[#a0a09c] uppercase mb-1">For Brands</div>
                  <h3 className="font-display text-2xl font-bold">Free to browse</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-xl">⚡</div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Browse the full creator directory',
                  'Post from $149/mo (Starter plan)',
                  'Up to 3 active job posts',
                  'Direct messaging with creators',
                  '10% platform fee on closed deals',
                  'Escrow payment protection',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                    <svg className="w-5 h-5 text-[#84cc16] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=brand" className="btn-ghost w-full text-sm justify-center border border-[#e8e8e4]">
                Get Started Free →
              </Link>
            </div>

            {/* Creators */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#84cc16] text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                FREE TO JOIN
              </div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-[#a0a09c] uppercase mb-1">For Creators</div>
                  <h3 className="font-display text-2xl font-bold">Always free to join</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-xl">🎯</div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Build your creator profile',
                  'Browse and apply to any brief',
                  'Direct messaging with brands',
                  '10% platform fee on earnings',
                  'Get paid directly to your account',
                  'Creator Pro: lower fees + profile boost',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                    <svg className="w-5 h-5 text-[#84cc16] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=creator" className="btn-primary w-full text-sm justify-center">
                Join Free Today →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────── */}
      <section className="py-24 px-8 bg-[#1c1c1c]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-8">🚀</div>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            The future of tech UGC<br />starts here
          </h2>
          <p className="text-[#6b6b6b] text-lg font-light mb-10 leading-relaxed">
            create your account. Be first to know when Otto opens.<br />
            Early members get priority access and reduced fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Get Early Access →
            </Link>
            <Link href="/login" className="btn-ghost text-base px-6 py-4 text-white/70 border-white/20 hover:bg-white/5">
              Browse as Guest
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────── */}
      <footer className="py-10 px-8 border-t border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="logo-mark">
            <span className="text-lg font-extrabold font-display tracking-tight">Otto</span>
            <span className="logo-dot" />
          </Link>
          <p className="text-sm text-[#a0a09c]">
            © 2025 Otto. All rights reserved.
          </p>
          <p className="text-sm text-[#a0a09c]">
            Built for what&apos;s next.
          </p>
        </div>
      </footer>

    </div>
  )
}
