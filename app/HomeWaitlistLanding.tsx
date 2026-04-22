'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Lightbulb, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'

type Role = 'creator' | 'brand'
type Vote = 'up' | 'down' | null

type RoadmapCard = {
  id: string
  status: 'Thinking' | 'Building' | 'Shipped'
  title: string
  body: string
  tag: string
}

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=96&q=80',
]

const OTTO_GREEN = '#BEF264'

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

const ROADMAP_CARDS: RoadmapCard[] = [
  {
    id: 'public-sites',
    status: 'Building',
    tag: 'Creator websites',
    title: 'Free public creator sites on name.ottougc.com',
    body: 'Every creator should get a proper public portfolio page they can actually share, not just a hidden profile inside a marketplace.',
  },
  {
    id: 'video-minimum',
    status: 'Building',
    tag: 'Onboarding',
    title: 'Require 3 strong videos before a creator goes live',
    body: 'Otto should feel curated. Better onboarding quality means better trust for brands and better outcomes for creators.',
  },
  {
    id: 'custom-domains',
    status: 'Thinking',
    tag: 'Pro plan',
    title: 'Custom domains for Pro creators',
    body: 'Free gets you a clean Otto subdomain. Pro should turn that into a real creator website with your own domain.',
  },
  {
    id: 'campaign-scheduling',
    status: 'Thinking',
    tag: 'Workflow',
    title: 'Built-in scheduling for brand + creator campaigns',
    body: 'Long term, Otto should help run the partnership after a hire happens — not just help make the intro.',
  },
]

function statusClasses(status: RoadmapCard['status']) {
  if (status === 'Shipped') return 'bg-[#efffd3] text-[#355400] border-[#dff3b3]'
  if (status === 'Building') return 'bg-[#fff6d8] text-[#6a5200] border-[#f4e1a0]'
  return 'bg-[#f3f3ef] text-[#5f5f58] border-[#e4e4dd]'
}

export default function HomeWaitlistLanding() {
  const [role, setRole] = useState<Role>('creator')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [idea, setIdea] = useState('')
  const [ideaSubmitted, setIdeaSubmitted] = useState(false)

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

  function setVote(cardId: string, value: Vote) {
    setVotes((current) => ({
      ...current,
      [cardId]: current[cardId] === value ? null : value,
    }))
  }

  function handleIdeaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!idea.trim()) return
    setIdeaSubmitted(true)
    setIdea('')
  }

  return (
    <div
      className="min-h-screen text-[#363535]"
      style={{
        backgroundColor: '#fafaf9',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23e8e8e4' stroke-width='0.75'/%3E%3C/svg%3E")`,
      }}
    >
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/85 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md md:px-6">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
            <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
          </a>
          <a href="#waitlist-form" className="btn-primary text-sm py-2 px-5">Join waitlist</a>
        </div>
      </header>

      <main>
        <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 pt-28 pb-12 md:px-10">
          <div className="w-full max-w-4xl text-center">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
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

            <div className="mb-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors duration-300 ${role === 'creator' ? 'text-black' : 'text-gray-400'}`}>
                I&apos;m a creator
              </span>

              <div className="relative inline-flex h-8 w-[58px] items-center justify-center rounded-full overflow-hidden shadow-[0_0_18px_rgba(190,242,100,0.28)]">
                <div
                  className="absolute inset-0 rounded-full animate-[spin_3.2s_linear_infinite]"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, ${OTTO_GREEN} 110deg, ${OTTO_GREEN} 220deg, transparent 360deg)`,
                  }}
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={role === 'brand'}
                  aria-label="Toggle creator or brand"
                  onClick={() => setRole(role === 'creator' ? 'brand' : 'creator')}
                  className="relative inline-flex h-[29px] w-[55px] items-center rounded-full px-[3px] focus:outline-none"
                  style={{ backgroundColor: OTTO_GREEN }}
                >
                  <span
                    className={`inline-block h-[23px] w-[23px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition-transform duration-300 ${role === 'brand' ? 'translate-x-[27px]' : 'translate-x-[1px]'}`}
                  />
                </button>
              </div>

              <span className={`text-sm font-medium transition-colors duration-300 ${role === 'brand' ? 'text-black' : 'text-gray-400'}`}>
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-8 md:px-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a86]">Roadmap feed</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3.4rem)] leading-[0.95] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                What we’re building next
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6b6b] md:text-base">
                Vote on what we should build next, or drop your own idea below.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
            <div className="space-y-4">
              {ROADMAP_CARDS.map((card) => {
                const vote = votes[card.id] ?? null
                return (
                  <article key={card.id} className="rounded-[28px] border border-[#e8e8e4] bg-white p-5 shadow-[0_10px_30px_rgba(28,28,30,0.05)] sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(card.status)}`}>
                        {card.status}
                      </span>
                      <span className="inline-flex rounded-full border border-[#ecece7] bg-[#fafaf8] px-3 py-1 text-xs font-medium text-[#6b6b6b]">
                        {card.tag}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-semibold leading-tight text-[#1c1c1e]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5f5f58] sm:text-[15px]">{card.body}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVote(card.id, 'up')}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${vote === 'up' ? 'border-[#dff3b3] bg-[#efffd3] text-[#355400]' : 'border-[#e8e8e4] bg-[#fcfcfa] text-[#4f4f49] hover:border-[#d9d9d2]'}`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Want this
                      </button>
                      <button
                        type="button"
                        onClick={() => setVote(card.id, 'down')}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${vote === 'down' ? 'border-[#f2d6d6] bg-[#fff3f3] text-[#8a2a2a]' : 'border-[#e8e8e4] bg-[#fcfcfa] text-[#4f4f49] hover:border-[#d9d9d2]'}`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Not useful
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="rounded-[28px] border border-[#e8e8e4] bg-white p-5 shadow-[0_10px_30px_rgba(28,28,30,0.05)] sm:p-6 lg:sticky lg:top-28">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ffd1] text-[#1c1c1e]">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#1c1c1e]">What do you want to see?</h3>
              <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">
                Drop a feature idea, creator pain point, or brand workflow problem. Keep it simple — I want signal, not essays.
              </p>

              <form onSubmit={handleIdeaSubmit} className="mt-5 space-y-3">
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Example: Let creators build a proper public site on name.ottougc.com"
                  className="min-h-[150px] w-full rounded-3xl border border-[#e8e8e4] bg-[#f8f8f5] px-5 py-4 text-sm text-[#1c1c1e] outline-none transition focus:border-[#ccff00]"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-[#1c1c1e] transition hover:opacity-90"
                  style={{ background: '#ccff00' }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Share idea
                </button>
              </form>

              {ideaSubmitted && (
                <p className="mt-3 text-sm text-[#5f5f5b]">Got it — that’s exactly the kind of thing I want more of.</p>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
