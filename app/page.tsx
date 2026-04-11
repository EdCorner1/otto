'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <circle cx="8" cy="8" r="8" fill="#ccff00" />
      <path d="M5 8.5L7 10.5L11 6.5" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline ml-1.5">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  cover_image_url: string
  published_at: string
}

export default function HomePage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [signupSubmitted, setSignupSubmitted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setPosts(data)
      })
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSignupSubmitted(true)
  }

  const faqs = [
    {
      q: 'Do I need an audience to join?',
      a: 'No. Otto is built for creators at any stage — 0 followers or 100K. Brands care about the quality of your work, not your follower count.',
    },
    {
      q: 'How do payments work?',
      a: 'Brands pay upfront into escrow via Stripe. Creators receive payment on the day the brand approves the work. No invoicing, no chasing.',
    },
    {
      q: 'What kind of brands are on Otto?',
      a: 'Tech, SaaS, AI tools, productivity apps, and developer-facing products. If you use or would recommend a piece of software, a brand probably wants you to talk about it.',
    },
    {
      q: 'Is Otto free to use?',
      a: 'Free for creators. Brands pay a small flat fee per brief — no commission on deals, no subscription. You know exactly what it costs upfront.',
    },
  ]

  const featuredCreators = [
    { name: 'Mia Thornton', niche: 'AI productivity tools', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
    { name: 'James Okafor', niche: 'Developer tools & SaaS', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
    { name: 'Sara Lindström', niche: 'Mac apps & workflows', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
    { name: 'Devon Reyes', niche: 'AI apps & chat tools', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face' },
  ]

  const brands = ['Raycast', 'Notion', 'Linear', 'Vercel', 'Loom', 'Cron']

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/blog" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Blog</Link>
          {user ? (
            <Link href="/dashboard" className="btn-primary text-sm py-2 px-5">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Sign in</Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 rounded-xl text-[#363535] hover:bg-[#f0f0ec] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col pt-24 px-6 bg-white/95 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 p-2 text-[#363535]"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex flex-col gap-1">
            <Link href="/blog" onClick={() => setMobileOpen(false)}
              className="py-4 text-lg font-medium text-[#363535] border-b border-[#f0f0ec]">
              Blog
            </Link>
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                className="py-4 text-lg font-medium text-[#363535] border-b border-[#f0f0ec]">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="py-4 text-lg font-medium text-[#363535] border-b border-[#f0f0ec]">
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}
                  className="mt-4 btn-primary py-3 text-center text-base">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <main>

        {/* ── Hero ── */}
        <section className="pt-40 pb-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ccff00]/30 rounded-full text-xs font-semibold text-[#363535] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#363535] animate-pulse" />
              For tech creators and the brands that need them
            </div>

            <h1 style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 700,
              fontSize: 'clamp(36px, 7vw, 72px)',
              lineHeight: 1.0,
              letterSpacing: '-3.5px',
              color: '#1c1c1e',
            }} className="mb-6">
              UGC that actually<br />
              <span style={{ color: '#6b6b6b' }}>converts</span>
            </h1>

            <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '18px', lineHeight: 1.7, color: '#6b6b6b' }}
              className="max-w-xl mx-auto mb-10">
              Otto connects tech brands with UGC creators who know their audience.
              No cold outreach. No algorithmic guessing. Just real work, fairly priced.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
                Get Started <ArrowRight />
              </Link>
              <Link href="/blog" className="px-8 py-3.5 text-base text-[#6b6b6b] hover:text-[#363535] transition-colors font-medium">
                Read the free series →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Social proof strip ── */}
        <section className="py-12 px-6 border-y border-[#f0f0ec] bg-white">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '0 → £6K', label: 'in 4 months' },
              { value: '5 active', label: 'deals secured' },
              { value: '1 platform', label: 'end-to-end' },
              { value: '30-day', label: 'free creator series' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '28px', letterSpacing: '-2px', color: '#1c1c1e' }}>
                  {value}
                </p>
                <p className="text-xs text-[#9a9a9a] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">

            <p className="text-xs font-bold text-[#9a9a9a] uppercase tracking-widest text-center mb-3">Simple by design</p>
            <h2 style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 700,
              fontSize: 'clamp(24px, 4vw, 40px)',
              letterSpacing: '-2px',
              color: '#1c1c1e',
            }} className="text-center mb-16">
              How Otto works
            </h2>

            <div className="space-y-0">
              {[
                {
                  step: '01',
                  title: 'Briefs get posted',
                  desc: 'Brands describe exactly what they need — product, format, deadline, budget. Creators apply with a specific pitch, not a generic cover letter.',
                },
                {
                  step: '02',
                  title: 'You match and agree',
                  desc: 'Browse briefs that fit your niche. Apply with a personalised intro and your relevant work. Brands pick the creator that fits.',
                },
                {
                  step: '03',
                  title: 'Create and deliver',
                  desc: 'Make content that feels like you found the product and loved it. Submit via Otto. Brand reviews and approves — or requests one clean revision.',
                },
                {
                  step: '04',
                  title: 'Get paid',
                  desc: 'Stripe handles the payment. Brand pays upfront, creator gets paid on approval. No chasing invoices.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-6 py-8 border-b border-[#f0f0ec] last:border-0">
                  <span className="text-xs font-bold bg-[#ccff00] text-[#1c1c1e] px-2.5 py-1 rounded-lg h-fit flex-shrink-0 mt-0.5" style={{ fontFamily: 'var(--font-bricolage)' }}>
                    {step}
                  </span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '20px', letterSpacing: '-0.5px', color: '#1c1c1e' }}
                      className="mb-2">
                      {title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '15px', lineHeight: 1.7, color: '#6b6b6b' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── For creators / For brands ── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">

            <div className="p-8 bg-[#fafaf9] border border-[#e8e8e4] rounded-2xl">
              <div className="text-3xl mb-4">🎬</div>
              <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '24px', letterSpacing: '-1px', color: '#1c1c1e' }}
                className="mb-2">
                For Creators
              </h3>
              <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '15px', lineHeight: 1.7, color: '#6b6b6b' }} className="mb-6">
                Get matched with brands that actually need your specific content style. No audience minimums.
              </p>
              <ul className="space-y-3">
                {[
                  'Briefs targeted at your niche',
                  'Keep 100% of your rate — no commission',
                  'Direct communication with brands',
                  'Get paid before you start filming',
                  'Build a portfolio with real brand names',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span style={{ fontFamily: 'var(--font-open-sans)', fontSize: '14px', color: '#363535' }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="mt-8 inline-flex items-center gap-2 btn-primary px-6 py-2.5 text-sm">
                Start as Creator <ArrowRight />
              </Link>
            </div>

            <div className="p-8 bg-[#1c1c1e] border border-[#1c1c1e] rounded-2xl text-white">
              <div className="text-3xl mb-4">🏷️</div>
              <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '24px', letterSpacing: '-1px', color: '#fff' }}
                className="mb-2">
                For Brands
              </h3>
              <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)' }} className="mb-6">
                Authentic UGC content that converts — without the influencer minimums or agency fees.
              </p>
              <ul className="space-y-3">
                {[
                  'Browse creator profiles before applying',
                  'Set your budget, get scoped proposals',
                  'One revision included, clearly priced',
                  'Content approval before payment releases',
                  'Campaign archive for future use',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                      <circle cx="8" cy="8" r="8" fill="#ccff00" />
                      <path d="M5 8.5L7 10.5L11 6.5" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-open-sans)', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl text-[#1c1c1e]"
                style={{ backgroundColor: '#ccff00' }}>
                Post a Brief <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Featured Creators ── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold text-[#9a9a9a] uppercase tracking-widest mb-2">The creators</p>
                <h2 style={{
                  fontFamily: 'var(--font-bricolage)',
                  fontWeight: 700,
                  fontSize: 'clamp(22px, 3.5vw, 36px)',
                  letterSpacing: '-1.5px',
                  color: '#1c1c1e',
                }}>
                  Meet the creators on Otto
                </h2>
              </div>
              <Link href="/creators" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors hidden sm:block">
                Browse all →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredCreators.map(({ name, niche, img }) => (
                <div key={name} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-[#e8e8e4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={name} className="object-cover w-full h-full" />
                  </div>
                  <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '14px', color: '#1c1c1e' }}
                    className="mb-0.5">
                    {name}
                  </p>
                  <p className="text-xs text-[#9a9a9a]">{niche}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Brands on Otto ── */}
        <section className="py-16 px-6 border-y border-[#f0f0ec] bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold text-[#9a9a9a] uppercase tracking-widest mb-8">
              Brands already using Otto to find creators
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {brands.map(brand => (
                <span key={brand}
                  style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '18px', letterSpacing: '-1px', color: '#c0c0bc' }}
                  className="hover:text-[#9a9a9a] transition-colors cursor-default">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── From the Blog ── */}
        {posts.length > 0 && (
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs font-bold text-[#9a9a9a] uppercase tracking-widest mb-2">Free resource</p>
                  <h2 style={{
                    fontFamily: 'var(--font-bricolage)',
                    fontWeight: 700,
                    fontSize: 'clamp(22px, 3.5vw, 36px)',
                    letterSpacing: '-1.5px',
                    color: '#1c1c1e',
                  }}>
                    From the blog
                  </h2>
                </div>
                <Link href="/blog" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors hidden sm:block">
                  See all posts →
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {posts.slice(0, 3).map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className="group block bg-white border border-[#e8e8e4] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {post.cover_image_url && (
                      <div className="aspect-video overflow-hidden bg-[#f0f0ec]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '15px', color: '#1c1c1e', lineHeight: 1.3 }}
                        className="mb-2">
                        {post.title}
                      </p>
                      <p className="text-xs text-[#9a9a9a] line-clamp-2"
                        style={{ fontFamily: 'var(--font-open-sans)', lineHeight: 1.6 }}>
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold text-[#9a9a9a] uppercase tracking-widest text-center mb-3">Questions</p>
            <h2 style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 700,
              fontSize: 'clamp(22px, 3.5vw, 36px)',
              letterSpacing: '-1.5px',
              color: '#1c1c1e',
            }} className="text-center mb-12">
              Anything else
            </h2>

            <div className="space-y-0">
              {faqs.map(({ q, a }, i) => (
                <div key={i} className="border-b border-[#f0f0ec] last:border-0">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between py-5 text-left"
                  >
                    <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '16px', color: '#1c1c1e' }}>
                      {q}
                    </span>
                    <span className="text-[#9a9a9a] ml-4 flex-shrink-0">
                      {faqOpen === i ? <MinusIcon /> : <PlusIcon />}
                    </span>
                  </button>
                  {faqOpen === i && (
                    <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '15px', lineHeight: 1.7, color: '#6b6b6b' }}
                      className="pb-5">
                      {a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Signup CTA ── */}
        <section className="py-24 px-6 bg-[#1c1c1e]">
          <div className="max-w-xl mx-auto text-center">
            <h2 style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 5vw, 48px)',
              letterSpacing: '-2px',
              color: '#fff',
            }} className="mb-4">
              Get early access
            </h2>
            <p style={{ fontFamily: 'var(--font-open-sans)', fontSize: '16px', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)' }}
              className="mb-10">
              create your account. Be first to know when Otto opens for creators and brands.
            </p>

            {signupSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-[#ccff00]">
                <CheckIcon />
                <span style={{ fontFamily: 'var(--font-open-sans)', fontWeight: 600, fontSize: '16px' }}>You're on the list. We'll be in touch.</span>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                />
                <button type="submit"
                  className="px-6 py-3 rounded-xl text-sm font-bold text-[#1c1c1e] flex-shrink-0"
                  style={{ backgroundColor: '#ccff00' }}>
                  Join
                </button>
              </form>
            )}

            <p className="mt-4 text-xs text-white/25">No spam. Just launch updates.</p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[#e8e8e4] py-8 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '16px', color: '#363535' }}>
              Otto <span style={{ color: '#ccff00' }}>●</span>
            </p>
            <div className="flex items-center gap-6 text-sm text-[#9a9a9a]">
              <Link href="/blog" className="hover:text-[#363535] transition-colors">Blog</Link>
              <Link href="/signup" className="hover:text-[#363535] transition-colors">Signup</Link>
              <a href="https://twitter.com/DefinitelyEd" target="_blank" rel="noopener noreferrer" className="hover:text-[#363535] transition-colors">Twitter</a>
            </div>
            <p className="text-xs text-[#9a9a9a]">© {new Date().getFullYear()} Otto</p>
          </div>
        </footer>

      </main>
    </div>
  )
}
