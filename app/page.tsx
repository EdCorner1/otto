import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ─── STICKY NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur-md bg-[#fafaf9]/85 border-b border-[#e8e8e4]/60">
        <Link href="/" className="logo-mark">
          <span className="text-xl font-extrabold font-display tracking-tight text-[#1c1c1c]">Otto</span>
          <span className="logo-dot" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm py-2.5 px-5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 xl:gap-16 items-start">

          {/* Left column */}
          <div className="lg:col-span-6 lg:pt-8">
            
            {/* Launch badge */}
            <div className="fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#e8e8e4] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]" />
              </span>
              <span className="text-xs font-semibold text-[#6b6b6b] tracking-wide">LAUNCHING SOON · 2025</span>
            </div>

            {/* Headline */}
            <h1 className="fade-up stagger-1 font-display text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[0.95] mb-6 text-[#1c1c1c]">
              The UGC marketplace<br />
              <span className="text-[#84cc16]">for tech</span><br />
              brands & creators
            </h1>

            {/* Sub */}
            <p className="fade-up stagger-2 text-[#6b6b6b] text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Post a brief. Get matched with vetted tech creators. Ship content faster.
            </p>

            {/* CTAs */}
            <div className="fade-up stagger-3 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary text-base px-7 py-4">
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href="/login" className="btn-ghost text-base px-6 py-4 border border-[#e8e8e4]">
                Browse as Guest
              </Link>
            </div>

            {/* Social proof */}
            <div className="fade-up stagger-4 flex items-center gap-4 mt-10 pt-8 border-t border-[#e8e8e4]">
              <div className="flex -space-x-3">
                {['SC', 'MR', 'PS', 'JK', 'AL'].map((initials, i) => (
                  <img 
                    key={i}
                    src={`https://ui-avatars.com/api/?name=${initials}&background=f2fbe4&color=6db80f&bold=true&size=36`}
                    alt={initials}
                    className="w-9 h-9 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div className="text-sm text-[#6b6b6b]">
                <span className="font-semibold text-[#1c1c1c]">500+ creators</span> · <span className="font-semibold text-[#1c1c1c]">50+ brands</span> on signup
              </div>
            </div>
          </div>

          {/* Right column — video grid */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* Main large video */}
              <div className="col-span-2 md:col-span-1 md:row-span-2">
                <div className="relative w-full aspect-[16/10] md:aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=0&rel=0&modestbranding=1"
                    title="Tech UGC content sample"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              {/* Smaller videos */}
              <div className="hidden md:block">
                <div className="relative w-full aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube-nocookie.com/embed/ScMzIvxBSi4?controls=0&rel=0&modestbranding=1"
                    title="Tech creator content"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative w-full aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?controls=0&rel=0&modestbranding=1"
                    title="UGC platform demo"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
            {/* Caption under videos */}
            <p className="mt-3 text-xs text-[#9a9a9a] text-center md:text-left">
              Real creators. Real tech. Real UGC.
            </p>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE STRIP ─────────────────────────────────── */}
      <div className="overflow-hidden bg-[#1c1c1c] py-4 border-y border-white/5">
        <div className="flex whitespace-nowrap">
          <div className="marquee-track flex items-center gap-0">
            {Array(3).fill([
              '⚡ Tech UGC Marketplace',
              '✦ No Cold DMs',
              '✦ Vetted Creators',
              '✦ Escrow Protected',
              '✦ Post a Brief Get Matched',
              '✦ Built for Tech Brands',
              '⚡ Faster. Smarter. Fairer.',
              '✦ Post a Brief Get Matched',
              '✦ Escrow Protected',
              '✦ Vetted Creators',
              '✦ No Cold DMs',
              '⚡ Tech UGC Marketplace',
            ]).flat().map((item, i) => (
              <span key={`m-${i}`} className="flex items-center">
                <span className="text-sm md:text-base font-medium text-white/70 px-6 md:px-8">{item}</span>
                <span className="text-[#84cc16]">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── BRAND LOGOS ───────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-[#9a9a9a] mb-10">
            Trusted by forward-thinking tech brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 md:gap-x-14 gap-y-6">
            {['SHOPIFY', 'NOTION', 'LINEAR', 'VERCEL', 'RAYCAST', 'ARC', 'LOOM', 'DESCRIPT'].map((name) => (
              <span 
                key={name}
                className="text-sm md:text-base font-display font-bold tracking-widest uppercase text-[#c0c0bc] hover:text-[#6b6b6b] transition-colors duration-300 cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE PROPS ─────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 md:px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-14 md:mb-16 max-w-xl">
            <span className="section-label mb-4 block">Why Otto</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1c1c1c] leading-tight">
              Built for how tech UGC actually works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                icon: '📋',
                title: 'For Brands',
                desc: 'Post a brief. Get proposals from vetted tech creators in hours. Hire, pay, and manage all in one place — no more hunting on LinkedIn.',
                cta: 'Post a job →',
                ctaHref: '/signup?role=brand',
              },
              {
                icon: '💰',
                title: 'For Creators',
                desc: 'Find briefs that match your niche. Do work you care about. Get paid fairly — no negotiations, no lowballing, no chasing invoices.',
                cta: 'Join free →',
                ctaHref: '/signup?role=creator',
              },
              {
                icon: '🔗',
                title: 'The Platform',
                desc: 'Not another generic marketplace. Otto is built for gadgets, AI tools, SaaS, and the creators who actually understand and demo them.',
                cta: 'Learn more →',
                ctaHref: '#',
              },
            ].map(({ icon, title, desc, cta, ctaHref }, i) => (
              <div key={i} className="card card-hover flex flex-col group">
                <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {icon}
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
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            
            {/* Left: sticky header */}
            <div className="md:sticky md:top-32">
              <span className="section-label mb-4 block">How it works</span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1c1c1c] leading-tight mb-6">
                From brief to content in three steps
              </h2>
              <p className="text-[#6b6b6b] leading-relaxed mb-8 max-w-sm">
                Otto handles the messy middle — matching, communication, payment, escrow. 
                You focus on the creative.
              </p>
              <Link href="/signup" className="btn-primary text-base inline-flex items-center gap-2">
                Start for free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {/* Right: steps */}
            <div className="space-y-5 md:space-y-6">
              {[
                {
                  num: '01',
                  title: 'Post a brief',
                  desc: 'Fill out a structured brief — product, deliverables, platforms, timeline, budget. Takes under 5 minutes.',
                  detail: 'Structured. Clear. No back-and-forth.',
                  // Illustration: form-like divs
                  illustration: (
                    <div className="hidden sm:flex flex-col gap-2 mt-6 pr-4">
                      <div className="h-3 bg-[#f0f0ec] rounded-full w-full" />
                      <div className="h-3 bg-[#f0f0ec] rounded-full w-3/4" />
                      <div className="h-8 bg-[#e8e8e4] rounded-xl w-full mt-2" />
                      <div className="h-8 bg-[#e8e8e4] rounded-xl w-5/6" />
                      <div className="h-8 bg-[#e8e8e4] rounded-xl w-2/3" />
                      <div className="h-9 bg-[#84cc16]/20 rounded-xl w-1/3 mt-2" />
                    </div>
                  ),
                },
                {
                  num: '02',
                  title: 'Creators apply',
                  desc: 'Vetted creators browse your brief and submit proposals. Review portfolios, rates, and relevance. Chat to find the right fit.',
                  detail: 'You choose. No algorithm deciding for you.',
                  illustration: (
                    <div className="hidden sm:flex flex-col gap-3 mt-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2fbe4] flex items-center justify-center text-xs font-bold text-[#6db80f]">SC</div>
                        <div className="flex-1 h-3 bg-[#f0f0ec] rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2fbe4] flex items-center justify-center text-xs font-bold text-[#6db80f]">MR</div>
                        <div className="flex-1 h-3 bg-[#f0f0ec] rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2fbe4] flex items-center justify-center text-xs font-bold text-[#6db80f]">JK</div>
                        <div className="flex-1 h-3 bg-[#f0f0ec] rounded-full" />
                      </div>
                    </div>
                  ),
                },
                {
                  num: '03',
                  title: 'Get content + Otto handles payment',
                  desc: 'Once you hire, Otto holds payment in escrow until work is approved. Creator gets paid. Brand gets content. Everyone wins.',
                  detail: 'Escrow protection. Dispute resolution. Built in.',
                  illustration: (
                    <div className="hidden sm:flex items-center justify-center mt-6 pr-4">
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-[#84cc16]/30" />
                        <div className="absolute inset-3 rounded-full border-2 border-[#84cc16]/50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#84cc16]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ].map(({ num, title, desc, detail, illustration }, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 md:p-8 border border-[#e8e8e4]">
                  <div className="flex items-start gap-5 md:gap-6">
                    <div className="font-display text-4xl md:text-5xl font-extrabold text-[#84cc16]/15 leading-none flex-shrink-0 w-14 hidden md:block">
                      {num}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
                      <p className="text-[#6b6b6b] text-sm leading-relaxed mb-3">{desc}</p>
                      <p className="text-xs font-semibold text-[#a0a09c] tracking-wide uppercase mb-2">{detail}</p>
                      {illustration}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 md:px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-12 md:mb-16 text-left">
            <span className="section-label mb-4 block">Testimonials</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1c1c1c] leading-tight max-w-xl">
              What early users are saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                quote: "Otto is exactly what the tech UGC space needed. Found an amazing creator for our AI tool launch in under 48 hours. The structured brief process made everything so smooth.",
                name: 'Sarah Chen',
                role: 'Head of Growth @ Raycast',
                initials: 'SC',
              },
              {
                quote: "Finally a platform that understands tech products. The structured briefs mean I get work that's actually relevant to my audience. No more generic requests.",
                name: 'Marcus Rivera',
                role: 'Tech Creator · 47K followers',
                initials: 'MR',
              },
              {
                quote: "We were spending weeks finding creators on LinkedIn. Otto cut that to days. The escrow feature gives us confidence to try new creators without risk.",
                name: 'Priya Sharma',
                role: 'Marketing Lead @ Notion',
                initials: 'PS',
              },
            ].map(({ quote, name, role, initials }, i) => (
              <div key={i} className="card card-hover flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${initials}&background=f2fbe4&color=6db80f&bold=true&size=48`}
                    alt={name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-sm text-[#1c1c1c]">{name}</div>
                    <div className="text-xs text-[#9a9a9a]">{role}</div>
                  </div>
                </div>
                <p className="text-[#6b6b6b] text-sm leading-relaxed flex-1 italic">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-1 mt-4 pt-4 border-t border-[#e8e8e4]">
                  {[1,2,3,4,5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS SECTION ────────────────────────────────── */}
      <section className="bg-[#1c1c1c] py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { num: '500+', label: 'creators waiting' },
              { num: '50+', label: 'brands signed up' },
              { num: '<5 min', label: 'to post a brief' },
              { num: '10%', label: 'platform fee' },
            ].map(({ num, label }, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2">{num}</div>
                <div className="text-sm text-[#6b6b6b]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-12 md:mb-16 text-left md:text-center">
            <span className="section-label mb-4 block">Pricing</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1c1c1c] mb-4">
              Simple. Transparent.
            </h2>
            <p className="text-[#6b6b6b] text-lg font-light">
              No hidden fees. No surprise cuts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            
            {/* For Brands */}
            <div className="card flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-[#9a9a9a] uppercase mb-2">For Brands</div>
                  <h3 className="font-display text-2xl font-bold">Free to browse</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-xl">📋</div>
              </div>
              <div className="text-3xl font-display font-extrabold text-[#1c1c1c] mb-1">from $149<span className="text-base font-medium text-[#6b6b6b]">/mo</span></div>
              <p className="text-sm text-[#9a9a9a] mb-6">Starter plan · No commission on top</p>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Browse the full creator directory',
                  'Post up to 3 active job briefs',
                  'Direct messaging with creators',
                  '10% platform fee on closed deals',
                  'Escrow payment protection',
                  'Priority creator matching',
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

            {/* For Creators */}
            <div className="card relative flex flex-col overflow-hidden border-2 border-[#84cc16]/20">
              <div className="absolute top-0 right-0 bg-[#84cc16] text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl">
                FREE TO JOIN
              </div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-[#9a9a9a] uppercase mb-2">For Creators</div>
                  <h3 className="font-display text-2xl font-bold">Free to join</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-xl">💰</div>
              </div>
              <div className="text-3xl font-display font-extrabold text-[#1c1c1c] mb-1">10% <span className="text-base font-medium text-[#6b6b6b]">platform fee</span></div>
              <p className="text-sm text-[#9a9a9a] mb-6">Creator Pro: $29/mo for lower fees</p>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Build your creator profile',
                  'Browse and apply to any brief',
                  'Direct messaging with brands',
                  'Get paid directly to your account',
                  'Creator Pro: 5% fee + profile boost',
                  'Priority placement in search',
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
      <section className="py-20 md:py-28 px-6 md:px-10 bg-[#1c1c1c]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            The future of tech UGC<br />starts here
          </h2>
          <p className="text-[#6b6b6b] text-lg font-light mb-10 leading-relaxed">
            create your account. Be first in.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Get Started →
            </Link>
            <Link href="/login" className="btn-ghost text-base px-6 py-4 text-white/70 border-white/20 hover:bg-white/5 hover:border-white/30">
              Browse as Guest
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────── */}
      <footer className="py-10 px-6 md:px-10 border-t border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link href="/" className="logo-mark">
            <span className="text-lg font-extrabold font-display tracking-tight text-[#1c1c1c]">Otto</span>
            <span className="logo-dot" />
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#9a9a9a]">
            <Link href="/about" className="hover:text-[#1c1c1c] transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-[#1c1c1c] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1c1c1c] transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-[#1c1c1c] transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-[#9a9a9a]">
            © 2025 Otto. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}
