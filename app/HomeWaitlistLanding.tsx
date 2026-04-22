'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, Check, UserCircle2 } from 'lucide-react'

type Role = 'creator' | 'brand'

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=96&q=80',
]

const COPY: Record<
  Role,
  {
    audienceLabel: string
    headline: string
    subheadline: string
    button: string
    eyebrow: string
    bullets: string[]
    statLabel: string
    statValue: string
  }
> = {
  creator: {
    audienceLabel: 'For creators',
    eyebrow: 'Tech-first creator marketplace',
    headline: 'Find tech brands worth making content for',
    subheadline:
      'Build a clean portfolio, show real work, and get in front of brands looking for creators in AI, apps, SaaS, and consumer tech.',
    button: 'Join creator waitlist',
    bullets: [
      'Show your best work in a clean portfolio brands can review quickly.',
      'Get matched with briefs that fit your niche, platform, and style.',
      'Keep everything in one place once deals start moving.',
    ],
    statLabel: 'Built for',
    statValue: 'AI apps, SaaS, gadgets, and modern tech brands',
  },
  brand: {
    audienceLabel: 'For brands',
    eyebrow: 'Hire creators without the usual mess',
    headline: 'Hire creators who already know how to sell tech',
    subheadline:
      'Review real work, move faster on briefs, and get content that feels native to the platform instead of scripted like an ad.',
    button: 'Join brand waitlist',
    bullets: [
      'Review creator work before you commit, not after.',
      'Post briefs fast and keep conversations tied to real deliverables.',
      'Find creators who already understand tech products and buyer intent.',
    ],
    statLabel: 'Best fit for',
    statValue: 'Apps, SaaS, AI tools, consumer tech, and performance-minded teams',
  },
}

export default function HomeWaitlistLanding() {
  const [role, setRole] = useState<Role>('creator')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const content = useMemo(() => COPY[role], [role])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Try again.')
        return
      }

      const submittedEmail = email.trim().toLowerCase()
      setSubmitted(true)
      setEmail('')

      try {
        window.localStorage.setItem('otto_waitlist_email', submittedEmail)
        window.localStorage.setItem('otto_waitlist_role', role)
      } catch {}

      if (data?.redirectUrl) {
        const nextUrl = new URL(data.redirectUrl, window.location.origin)
        nextUrl.searchParams.set('email', submittedEmail)
        window.location.href = nextUrl.toString()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen text-[#363535]"
      style={{
        backgroundColor: '#fafaf9',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23e8e8e4' stroke-width='0.75'/%3E%3C/svg%3E")`,
      }}
    >
      <header className="fixed top-4 left-4 right-4 z-50 md:left-8 md:right-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/85 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
            <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
          </Link>
          <a href="#waitlist-form" className="btn-primary px-5 py-2 text-sm">Join waitlist</a>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 pb-12 pt-28 md:px-10">
        <section className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:items-center">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex -space-x-2.5">
                {AVATARS.map((src, index) => (
                  <div
                    key={src}
                    className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-[#fafaf9] bg-[#f0f0ec] shadow-sm sm:h-10 sm:w-10"
                    style={{ zIndex: AVATARS.length - index }}
                  >
                    <Image src={src} alt="Waitlist avatar" fill sizes="40px" className="object-cover" />
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white px-3.5 py-2 text-sm text-[#6b6b6b] shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ccff00]" />
                <p>
                  Join <span className="font-semibold text-[#1c1c1e]">250+ early creators and brands</span>
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-[22px] border border-[#e8e8e4] bg-white p-1.5 shadow-[0_12px_30px_rgba(28,28,30,0.05)]">
              <button
                type="button"
                onClick={() => setRole('creator')}
                className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                  role === 'creator'
                    ? 'bg-[#ccff00] text-[#1c1c1e]'
                    : 'text-[#6b6b6b] hover:bg-[#f5f5f2] hover:text-[#1c1c1e]'
                }`}
              >
                <UserCircle2 className="h-4 w-4" />
                Creators
              </button>
              <button
                type="button"
                onClick={() => setRole('brand')}
                className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                  role === 'brand'
                    ? 'bg-[#ccff00] text-[#1c1c1e]'
                    : 'text-[#6b6b6b] hover:bg-[#f5f5f2] hover:text-[#1c1c1e]'
                }`}
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Brands
              </button>
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a86]">{content.eyebrow}</p>

            <h1
              className="mt-3 max-w-4xl text-balance"
              style={{
                fontFamily: 'var(--font-bricolage)',
                fontWeight: 300,
                fontSize: 'clamp(3rem, 7.2vw, 6rem)',
                lineHeight: 0.96,
                letterSpacing: '-0.05em',
              }}
            >
              {content.headline}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#6b6b6b] md:text-lg">
              {content.subheadline}
            </p>

            <form
              id="waitlist-form"
              onSubmit={handleSubmit}
              className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-3 rounded-[28px] border border-[#e8e8e4] bg-white p-3 shadow-[0_8px_30px_rgba(28,28,30,0.06)] md:mx-0 md:flex-row md:items-center"
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-label="Email address"
                placeholder={role === 'creator' ? 'Enter your creator email' : 'Enter your work email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 flex-1 rounded-2xl border border-transparent bg-[#f5f5f3] px-5 text-[15px] text-[#1c1c1e] outline-none transition focus:border-[#ccff00]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold text-[#1c1c1e] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:px-7"
                style={{ background: '#ccff00' }}
              >
                {submitting ? 'Joining…' : submitted ? 'You’re in' : content.button}
                {!submitting && !submitted && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {error && <p className="mt-3 text-sm text-[#d14343]">{error}</p>}
            {!error && !submitted && (
              <p className="mt-3 text-sm text-[#8a8a86]">No spam. Just launch updates and early access.</p>
            )}
            {submitted && (
              <p className="mt-3 text-sm text-[#5f5f5b]">Nice — you’re on the list.</p>
            )}
          </div>

          <aside className="rounded-[32px] border border-[#e8e8e4] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.05)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a86]">{content.audienceLabel}</p>
                <h2
                  className="mt-3 text-[clamp(28px,4vw,38px)] leading-[0.95] text-[#1c1c1e]"
                  style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}
                >
                  Why Otto feels different
                </h2>
              </div>
              <div className="rounded-full bg-[#f3ffd1] px-3 py-1 text-xs font-semibold text-[#1c1c1e]">Early access</div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#ecece7] bg-[#fafaf8] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8a86]">{content.statLabel}</p>
              <p className="mt-2 text-lg font-semibold leading-snug text-[#1c1c1e]">{content.statValue}</p>
            </div>

            <ul className="mt-6 space-y-3">
              {content.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-[#ecece7] bg-[#fcfcfa] px-4 py-3.5 text-sm leading-6 text-[#4f4f4f]">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#ccff00] text-[#1c1c1e]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </main>
    </div>
  )
}
