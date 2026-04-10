import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold font-display tracking-tight">
          Otto<span className="inline-block w-2 h-2 bg-[#84cc16] rounded-full ml-0.5 mb-2" />
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-4">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#84cc16]/10 rounded-full text-sm font-medium text-[#6db80f] mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]"></span>
          </span>
          Launching soon
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight leading-tight mb-6 animate-fade-in-up animate-delay-100">
          The UGC marketplace<br />for tech brands & creators
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animate-delay-200">
          Otto connects forward-thinking tech brands with vetted UGC creators. 
          Faster briefs. Better matches. Real results. No more cold DMing.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up animate-delay-300">
          <Link href="/signup" className="btn-primary text-base w-full sm:w-auto">
            Get Started →
          </Link>
          <Link href="/login" className="btn-secondary text-base w-full sm:w-auto">
            Browse as Guest
          </Link>
        </div>
        
        <p className="text-sm text-gray-400 mt-6 animate-fade-in-up animate-delay-400">
          <span className="font-semibold text-gray-500">500 creators</span> ·{' '}
          <span className="font-semibold text-gray-500">50 brands</span> already waiting
        </p>
      </section>

      {/* Value Props */}
      <section className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-left">
              <span className="text-3xl mb-4 block">⚡</span>
              <h3 className="text-lg font-bold font-display mb-2">For Brands</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Post a brief. Get proposals from vetted tech creators in hours, not days. 
                Hire, pay, and manage all in one place.
              </p>
            </div>
            
            <div className="card text-left">
              <span className="text-3xl mb-4 block">🎯</span>
              <h3 className="text-lg font-bold font-display mb-2">For Creators</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Find tech briefs that match your niche. Do work you actually care about. 
                Get paid fairly — no negotiations, no lowballing.
              </p>
            </div>
            
            <div className="card text-left">
              <span className="text-3xl mb-4 block">🔗</span>
              <h3 className="text-lg font-bold font-display mb-2">Built for Tech</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Not another generic creator marketplace. Otto is built for gadgets, AI tools, 
                SaaS, and the creators who actually understand them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-gray-500 mb-12">
            Three steps from brief to content — no friction, no fluff.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="text-5xl font-extrabold font-display text-[#84cc16]/20 mb-3">01</div>
              <h3 className="font-bold font-display mb-2">Post a brief</h3>
              <p className="text-gray-500 text-sm">
                Brands fill out a structured brief — product, deliverables, platforms, budget. 
                Takes under 5 minutes.
              </p>
            </div>
            <div>
              <div className="text-5xl font-extrabold font-display text-[#84cc16]/20 mb-3">02</div>
              <h3 className="font-bold font-display mb-2">Get matched</h3>
              <p className="text-gray-500 text-sm">
                Creators browse open briefs and submit proposals. 
                Brands review, chat, and hire — all on platform.
              </p>
            </div>
            <div>
              <div className="text-5xl font-extrabold font-display text-[#84cc16]/20 mb-3">03</div>
              <h3 className="font-bold font-display mb-2">Get results</h3>
              <p className="text-gray-500 text-sm">
                Creator delivers, brand approves, payment releases. 
                Otto holds funds in escrow until everyone is happy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 mb-12">
            Start free. Scale when you're ready.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-display">For Brands</h3>
                <span className="badge bg-gray-100 text-gray-600">Free to browse</span>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-500">From $149/mo to post jobs and hire</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Post up to 3 jobs/mo (Starter)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Browse full creator directory
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    10% platform fee on deals
                  </li>
                </ul>
              </div>
              <Link href="/signup?role=brand" className="btn-secondary w-full text-sm block text-center">
                Start Free →
              </Link>
            </div>
            
            <div className="card border-[#84cc16] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge bg-[#84cc16] text-white text-xs">For Creators</span>
              </div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-lg font-bold font-display">For Creators</h3>
                <span className="badge bg-[#84cc16]/10 text-[#6db80f]">Free to join</span>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-500">Browse and apply to briefs for free</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Build your profile & portfolio
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Apply to any open brief
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#84cc16]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    10% platform fee — lower with Pro
                  </li>
                </ul>
              </div>
              <Link href="/signup?role=creator" className="btn-primary w-full text-sm block text-center">
                Join Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight mb-4">
            Ready to change how tech UGC works?
          </h2>
          <p className="text-gray-500 mb-8">
            create your account and be first to know when Otto launches.
          </p>
          <Link href="/signup" className="btn-primary inline-block">
            Get Early Access →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold font-display tracking-tight">
            Otto<span className="inline-block w-2 h-2 bg-[#84cc16] rounded-full ml-0.5 mb-2" />
          </span>
          <p className="text-sm text-gray-400">
            © 2025 Otto. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Built for what's next.
          </p>
        </div>
      </footer>
    </div>
  )
}
