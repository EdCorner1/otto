import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Atmospheric background blobs */}
      <div className="hero-blob" />
      <div className="hero-blob-2" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl font-extrabold font-display tracking-tight text-[#0c0c0c]">
            Otto<span className="logo-dot" />
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="text-sm font-medium text-[#6b6b6b] hover:text-[#0c0c0c] transition-colors px-4 py-2 rounded-full hover:bg-black/[0.04]"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm py-2.5 px-5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-8 py-24 md:py-36 max-w-5xl mx-auto text-center">
        
        {/* Launch badge */}
        <div className="animate-fade-up inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-full mb-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#84cc16]" />
          </span>
          <span className="text-sm font-semibold text-[#6db80f]">Launching soon</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-5xl md:text-7xl lg:text-8xl font-extrabold font-display tracking-tight leading-[0.95] mb-8 text-[#0c0c0c]">
          The UGC marketplace<br />
          <span className="text-[#84cc16]">for tech</span> brands<br />
          & creators
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-200 text-lg md:text-xl text-[#6b6b6b] max-w-xl mx-auto mb-12 leading-relaxed font-light">
          Otto connects forward-thinking tech brands with vetted UGC creators. 
          Faster briefs. Better matches. Real results.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link href="/signup" className="btn-primary text-base w-full sm:w-auto whitespace-nowrap">
            Get Started →
          </Link>
          <Link href="/login" className="btn-secondary text-base w-full sm:w-auto whitespace-nowrap">
            Browse as Guest
          </Link>
        </div>

        {/* Social proof */}
        <div className="animate-fade-up delay-400 flex items-center justify-center gap-2 text-sm text-[#6b6b6b]">
          <div className="flex -space-x-2">
            {['🤖', '⚡', '🎯', '🔥', '✨'].map((emoji, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#f2fbe4] border-2 border-white flex items-center justify-center text-sm">
                {emoji}
              </div>
            ))}
          </div>
          <span className="font-medium text-[#0c0c0c]">500 creators</span>
          <span className="text-[#b0b0ac]">·</span>
          <span className="font-medium text-[#0c0c0c]">50 brands</span>
          <span className="text-[#b0b0ac]">already waiting</span>
        </div>
      </section>

      {/* Value Props */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            
            <div className="card card-hover text-left group">
              <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                ⚡
              </div>
              <h3 className="text-xl font-bold font-display mb-3">For Brands</h3>
              <p className="text-[#6b6b6b] text-sm leading-relaxed">
                Post a brief. Get proposals from vetted tech creators in hours, not days. 
                Hire, pay, and manage — all in one place.
              </p>
            </div>

            <div className="card card-hover text-left group">
              <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                🎯
              </div>
              <h3 className="text-xl font-bold font-display mb-3">For Creators</h3>
              <p className="text-[#6b6b6b] text-sm leading-relaxed">
                Find tech briefs that match your niche. Do work you actually care about. 
                Get paid fairly — no lowballing, no cold DMs.
              </p>
            </div>

            <div className="card card-hover text-left group">
              <div className="w-12 h-12 rounded-2xl bg-[#f2fbe4] flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                🔗
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Built for Tech</h3>
              <p className="text-[#6b6b6b] text-sm leading-relaxed">
                Not another generic marketplace. Otto is built for gadgets, AI tools, SaaS, 
                and the creators who actually understand them.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-24 px-8 bg-white/40 backdrop-blur-sm border-y border-[#e8e8e4]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-[#6b6b6b] text-lg mb-16 font-light">
            Three steps from brief to content — no friction, no fluff.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { num: '01', title: 'Post a brief', desc: 'Brands fill out a structured brief — product, deliverables, platforms, budget. Takes under 5 minutes.' },
              { num: '02', title: 'Get matched', desc: 'Creators browse open briefs and submit proposals. Brands review, chat, and hire — all on platform.' },
              { num: '03', title: 'Get results', desc: 'Creator delivers, brand approves, payment releases. Otto holds funds in escrow until everyone is happy.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-extrabold font-display text-[#84cc16]/15 mb-4 leading-none">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold font-display mb-2">{step.title}</h3>
                <p className="text-[#6b6b6b] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-[#6b6b6b] text-lg mb-12 font-light">
            Start free. Scale when you&apos;re ready.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            
            {/* Brands */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-display">For Brands</h3>
                <span className="badge bg-[#f2fbe4] text-[#6db80f] text-xs">Free to browse</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Post up to 3 jobs/mo (Starter: $149)',
                  'Browse full creator directory',
                  'Chat directly with creators',
                  '10% platform fee on closed deals',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                    <svg className="w-5 h-5 text-[#84cc16] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=brand" className="btn-secondary w-full text-sm block text-center">
                Start Free →
              </Link>
            </div>

            {/* Creators */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="badge bg-[#84cc16] text-white text-xs">Free to join</span>
              </div>
              <div className="flex items-center justify-between mb-6 mt-2">
                <h3 className="text-xl font-bold font-display">For Creators</h3>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Build your profile & portfolio',
                  'Browse and apply to any open brief',
                  'Direct messaging with brands',
                  '10% platform fee — lower with Pro',
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                    <svg className="w-5 h-5 text-[#84cc16] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=creator" className="btn-primary w-full text-sm block text-center">
                Join Free →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight mb-4">
            Ready to change how<br />tech UGC works?
          </h2>
          <p className="text-[#6b6b6b] text-lg mb-10 font-light">
            create your account and be first through the door.
          </p>
          <Link href="/signup" className="btn-primary inline-block text-base px-8 py-4">
            Get Early Access →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-8 border-t border-[#e8e8e4]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-extrabold font-display tracking-tight">
            Otto<span className="logo-dot" />
          </span>
          <p className="text-sm text-[#b0b0ac]">
            © 2025 Otto. All rights reserved.
          </p>
          <p className="text-sm text-[#b0b0ac]">
            Built for what&apos;s next.
          </p>
        </div>
      </footer>

    </div>
  )
}
