'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type Role = 'creator' | 'brand'

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=96&q=80',
]

const COPY: Record<Role, { headline: string; subheadline: string; button: string }> = {
  creator: {
    headline: 'Get paid to make tech content for your favourite brands',
    subheadline: 'The platform that matches you with brands you actually want to work with.',
    button: 'Join waitlist',
  },
  brand: {
    headline: 'Get human content that connects with your audience',
    subheadline: 'UGC that sounds like a friend recommended you, not an ad.',
    button: 'Join waitlist',
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

      setSubmitted(true)
      setEmail('')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#363535]">
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/85 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md md:px-6">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
            <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
          </a>
          <a href="#waitlist-form" className="btn-primary text-sm py-2 px-5">Join waitlist</a>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 pt-28 pb-12 md:px-10">
        <section className="w-full max-w-4xl text-center">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex -space-x-3">
              {AVATARS.map((src, index) => (
                <div
                  key={src}
                  className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-[#fafaf9] bg-[#f0f0ec] shadow-sm"
                  style={{ zIndex: AVATARS.length - index }}
                >
                  <Image src={src} alt="Waitlist avatar" fill sizes="44px" className="object-cover" />
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ccff00] opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ccff00] shadow-[0_0_14px_rgba(204,255,0,0.85)]" />
              </span>
              <p className="text-sm font-medium text-[#6b6b6b]">
                Join <span className="font-semibold text-[#1c1c1e]">250+ others</span> already on the waitlist
              </p>
            </div>
          </div>

          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#e8e8e4] bg-white px-4 py-2 shadow-sm">
            <span className={`text-sm font-semibold transition-colors ${role === 'creator' ? 'text-[#1c1c1e]' : 'text-[#9a9a9a]'}`}>
              I&apos;m a creator
            </span>

            <button
              type="button"
              aria-label="Toggle creator or brand"
              aria-pressed={role === 'brand'}
              onClick={() => setRole((current) => (current === 'creator' ? 'brand' : 'creator'))}
              className="relative inline-flex h-8 w-14 items-center rounded-full border border-[#bfe800] bg-[#ccff00] p-1 transition-all duration-200"
            >
              <span
                className="absolute h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-200"
                style={{ left: role === 'brand' ? 'calc(100% - 1.75rem)' : '0.25rem' }}
              />
            </button>

            <span className={`text-sm font-semibold transition-colors ${role === 'brand' ? 'text-[#1c1c1e]' : 'text-[#9a9a9a]'}`}>
              I&apos;m a brand
            </span>
          </div>

          <h1
            className="mx-auto max-w-5xl text-center text-balance"
            style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 7.2vw, 6rem)',
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
            }}
          >
            {content.headline}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-[#6b6b6b] md:text-lg">
            {content.subheadline}
          </p>

          <form
            id="waitlist-form"
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-3 rounded-[28px] border border-[#e8e8e4] bg-white p-3 shadow-[0_8px_30px_rgba(28,28,30,0.06)] md:flex-row md:items-center"
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label="Email address"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 flex-1 rounded-2xl border border-transparent bg-[#f5f5f3] px-5 text-[15px] text-[#1c1c1e] outline-none transition focus:border-[#ccff00]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-bold text-[#1c1c1e] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:px-7"
              style={{ background: '#ccff00' }}
            >
              {submitting ? 'Joining…' : submitted ? 'You’re in' : content.button}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-[#d14343]">{error}</p>}
          {!error && !submitted && (
            <p className="mt-3 text-sm text-[#8a8a86] text-center">No spam. Just launch updates and first access.</p>
          )}
          {submitted && (
            <p className="mt-3 text-sm text-[#5f5f5b] text-center">Nice — you’re on the list.</p>
          )}
        </section>
      </main>
    </div>
  )
}
