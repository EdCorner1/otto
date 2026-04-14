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
    button: 'Join as a creator',
  },
  brand: {
    headline: 'Get human content that connects with your audience',
    subheadline: 'UGC that sounds like a friend recommended you, not an ad.',
    button: 'Join as a brand',
  },
}

export default function WaitlistPage() {
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
        setSubmitting(false)
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
    <main className="min-h-screen overflow-hidden bg-[#fafaf9] text-[#1c1c1e]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(204,255,0,0.16),rgba(204,255,0,0.03)_45%,transparent_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35),rgba(250,250,249,0))]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto mb-12 inline-flex items-center gap-2 md:mb-16">
          <span
            className="text-[28px] font-semibold tracking-[-0.06em] text-[#1c1c1e]"
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Otto
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ccff00] shadow-[0_0_18px_rgba(204,255,0,0.8)]" />
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3 md:mb-10">
            <div className="flex -space-x-3">
              {AVATARS.map((src, index) => (
                <div
                  key={src}
                  className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#fafaf9] bg-[#f0f0ec] shadow-sm"
                  style={{ zIndex: AVATARS.length - index }}
                >
                  <Image src={src} alt="Waitlist member avatar" fill sizes="40px" className="object-cover" />
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ccff00] opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ccff00] shadow-[0_0_14px_rgba(204,255,0,0.85)]" />
              </span>
              <p className="text-sm font-medium text-[#5f5f5b]">
                Join <span className="font-semibold text-[#1c1c1e]">250+ others</span> already on the waitlist
              </p>
            </div>
          </div>

          <div className="mb-8 inline-flex rounded-full border border-[#e8e8e4] bg-white p-1 shadow-sm md:mb-10">
            {(['creator', 'brand'] as const).map((option) => {
              const active = role === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  aria-pressed={active}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 md:px-6"
                  style={{
                    background: active ? '#1c1c1e' : 'transparent',
                    color: active ? '#ffffff' : '#6b6b6b',
                  }}
                >
                  I&apos;m a {option}
                </button>
              )
            })}
          </div>

          <h1
            className="max-w-5xl text-balance"
            style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 300,
              fontSize: 'clamp(2.8rem, 7vw, 5.8rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            {content.headline}
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[#6f6f6b] md:mt-7 md:text-lg">
            {content.subheadline}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 flex w-full max-w-2xl flex-col gap-3 rounded-[28px] border border-[#e8e8e4] bg-white/92 p-3 shadow-[0_8px_30px_rgba(28,28,30,0.06)] backdrop-blur md:mt-12 md:flex-row md:items-center">
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
            <p className="mt-3 text-sm text-[#8a8a86]">No spam. Just launch updates and first access.</p>
          )}
          {submitted && (
            <p className="mt-3 text-sm text-[#5f5f5b]">Nice — you’re on the list.</p>
          )}
        </div>
      </section>
    </main>
  )
}
