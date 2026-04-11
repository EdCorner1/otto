import Link from 'next/link'
import Image from 'next/image'

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
        <div className="flex items-center gap-5">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      {/* ─── HERO — full first screen ─────────────────────── */}
      <section className="min-h-screen flex flex-col justify-center pt-20 pb-10 px-6 md:px-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center flex-1 py-8">

          {/* LEFT: Content */}
          <div>
            {/* Badge */}
            <div className="fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ccff00] mb-7">
              <span className="text-xs font-semibold text-[#1c1c1c] tracking-wide">🔥 Launching Soon · Limited Spots</span>
            </div>

            {/* Headline — exact match to Ed's site */}
            <h1 className="fade-up stagger-1" style={{ fontWeight: 600, fontSize: 'clamp(48px, 7vw, 84px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }}>
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
                <span className="text-sm font-semibold text-[#1c1c1c]">500+ creators &amp; 50+ brands on the signup</span>
              </div>
              <p className="mt-2 text-xs text-[#9a9a9a]">
                Avg. brief fills in 48hrs · Escrow protected · No cold DMs
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

          {/* RIGHT: Photo grid */}
          <div className="fade-up stagger-2">
            <div className="grid grid-cols-2 gap-3">
              {/* Top-left — large */}
              <div className="col-span-2 sm:col-span-1 sm:row-span-2">
                <div className="relative w-full aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shadow-xl shadow-black/8 bg-[#e8e8e4]">
                  <Image
                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop"
                    alt="Content creator with tech setup"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </div>
              {/* Top-right */}
              <div className="hidden sm:block">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl shadow-black/8 bg-[#e8e8e4]">
                  <Image
                    src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop"
                    alt="Creator filming on phone"
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              </div>
              {/* Bottom-right */}
              <div className="hidden sm:block">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl shadow-black/8 bg-[#e8e8e4]">
                  <Image
                    src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=600&h=400&fit=crop"
                    alt="Tech workspace"
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-start gap-6 mt-5">
              {[
                { num: '500+', label: 'Creators' },
                { num: '50+', label: 'Brands' },
                { num: '<5min', label: 'Briefs' },
                { num: '10%', label: 'Fee' },
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

      {/* ─── BRAND LOGO TICKER ─────────────────────────────── */}
      <section className="py-10 px-6 border-t border-[#e8e8e4] overflow-hidden">
        <p className="text-center text-xs font-semibold text-[#9a9a9a] uppercase tracking-widest mb-7">
          Trusted by tech brands building with UGC
        </p>
        <div className="relative">
          <div className="flex gap-12 animate-[scroll-logos_30s_linear_infinite]">
            {[
              { name: 'Raycon', emoji: '🔊' },
              { name: 'Anker', emoji: '⚡' },
              { name: 'OtterBox', emoji: '🛡️' },
              { name: 'Wyze', emoji: '📷' },
              { name: 'Mpow', emoji: '🎧' },
              { name: 'TaoTronics', emoji: '🔊' },
              { name: 'JBL', emoji: '🔉' },
              { name: 'Samsung', emoji: '📱' },
              { name: 'Sony', emoji: '🎮' },
              { name: 'Bose', emoji: '🔇' },
              { name: 'Satechi', emoji: '⚡' },
              { name: 'Twelve South', emoji: '📐' },
            ].map(({ name, emoji }) => (
              <div key={name} className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-white border border-[#e8e8e4] rounded-xl shadow-sm">
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-semibold text-[#363535] whitespace-nowrap">{name}</span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {[
              { name: 'Raycon', emoji: '🔊' },
              { name: 'Anker', emoji: '⚡' },
              { name: 'OtterBox', emoji: '🛡️' },
              { name: 'Wyze', emoji: '📷' },
              { name: 'Mpow', emoji: '🎧' },
              { name: 'TaoTronics', emoji: '🔊' },
              { name: 'JBL', emoji: '🔉' },
              { name: 'Samsung', emoji: '📱' },
              { name: 'Sony', emoji: '🎮' },
              { name: 'Bose', emoji: '🔇' },
              { name: 'Satechi', emoji: '⚡' },
              { name: 'Twelve South', emoji: '📐' },
            ].map(({ name, emoji }) => (
              <div key={`dup-${name}`} className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 bg-white border border-[#e8e8e4] rounded-xl shadow-sm">
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-semibold text-[#363535] whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes scroll-logos {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
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
                  { icon: '📺', title: 'Expensive production', desc: 'Crew, equipment, studio time — £5k–£50k per spot' },
                  { icon: '🚫', title: 'Audiences skip or block', desc: 'Ad blockers, DVR skipping, banner blindness' },
                  { icon: '😴', title: 'Low engagement', desc: '0.5–1% average CTR on display ads' },
                  { icon: '🧊', title: 'Feels impersonal', desc: 'Audiences know it is an ad — trust is low' },
                  { icon: '🔄', title: 'Long turnaround', desc: '4–12 weeks from brief to final delivery' },
                  { icon: '💸', title: 'High cost per acquisition', desc: '£15–£80 CPA through paid channels' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="text-lg mt-0.5">{icon}</span>
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
                  { icon: '📱', title: 'Creator-ready content', desc: 'Real creators, real devices — starting from £75 per piece' },
                  { icon: '✅', title: 'Audiences engage', desc: 'UGC gets 2× more engagement than branded content' },
                  { icon: '🚀', title: '4× higher conversions', desc: 'Creators you trust = actions you take' },
                  { icon: '🤝', title: 'Authentic voice', desc: 'Content that sounds like a mate, not a sales pitch' },
                  { icon: '⚡', title: 'Ship in days', desc: 'Brief today, content in your hands within 48hrs' },
                  { icon: '💰', title: 'Lower cost per acquisition', desc: 'Organic reach + trusted voice = better ROI' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="text-lg mt-0.5">{icon}</span>
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
            Ready to transform your content strategy?
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
          <p className="mt-4 text-sm text-[#6b6b6b]">Free for creators. No credit card required.</p>
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
