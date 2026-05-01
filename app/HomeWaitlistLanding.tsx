'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Clock3, Hammer, Loader2, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'

type Role = 'creator' | 'brand'
type Vote = 'up' | 'down' | null

type RoadmapCard = {
  id: string
  status: 'Under consideration' | 'Building now' | 'Shipped this week'
  title: string
  body: string
  tag: string
  upvotes: number
  downvotes: number
}

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
    button: 'Get early access',
  },
  brand: {
    headline: 'Get human content that connects with your audience',
    subheadline: 'UGC that sounds like a friend recommended you, not an ad.',
    button: 'Get early access',
  },
}

const ROADMAP_CARDS: RoadmapCard[] = [
  {
    id: 'live-campaigns',
    status: 'Shipped this week',
    tag: 'Workflow',
    title: 'Keep campaigns, deliverables, and feedback in one place',
    body: 'Less chasing, less mess, and a clearer view of what needs to happen next.',
    upvotes: 28,
    downvotes: 1,
  },
  {
    id: 'public-sites',
    status: 'Building now',
    tag: 'Creator sites',
    title: 'Give creators a public page they can actually share',
    body: 'A clean portfolio link makes it easier to pitch, get reviewed quickly, and look more credible from the start.',
    upvotes: 42,
    downvotes: 3,
  },
  {
    id: 'video-minimum',
    status: 'Building now',
    tag: 'Onboarding',
    title: 'Make creator profiles stronger before they go live',
    body: 'Three solid videos is the current minimum so brands can judge quality fast without creating unnecessary signup friction.',
    upvotes: 37,
    downvotes: 4,
  },
  {
    id: 'fast-payouts',
    status: 'Under consideration',
    tag: 'Creator ops',
    title: 'Get paid faster',
    body: 'Long payout windows make good work feel worse than it should. Faster payouts would build a lot more trust.',
    upvotes: 46,
    downvotes: 2,
  },
  {
    id: 'post-scheduling',
    status: 'Under consideration',
    tag: 'Scheduling',
    title: 'Make post scheduling part of the workflow',
    body: 'Once a creator gets hired, planning and scheduling posts should feel easier, not more fragmented.',
    upvotes: 39,
    downvotes: 3,
  },
  {
    id: 'ai-coach',
    status: 'Under consideration',
    tag: 'AI tools',
    title: 'Help creators improve content and engagement',
    body: 'A light-touch coach could help with hooks, positioning, and growth without making everything feel generic.',
    upvotes: 33,
    downvotes: 6,
  },
  {
    id: 'portfolio-roasts',
    status: 'Under consideration',
    tag: 'Feedback',
    title: 'Give creators honest portfolio feedback',
    body: 'Sometimes a sharp, useful roast is worth more than another vague compliment.',
    upvotes: 41,
    downvotes: 4,
  },
  {
    id: 'creator-community',
    status: 'Under consideration',
    tag: 'Community',
    title: 'Create a better place for creators to learn from each other',
    body: 'Not a noisy forum. Just somewhere cleaner to trade ideas, wins, and what is actually working.',
    upvotes: 35,
    downvotes: 5,
  },
  {
    id: 'finding-clients',
    status: 'Under consideration',
    tag: 'Growth',
    title: 'Make it easier to find clients',
    body: 'Discovery matters, but so does helping creators get more intentional about how they land work.',
    upvotes: 44,
    downvotes: 2,
  },
  {
    id: 'account-growth',
    status: 'Under consideration',
    tag: 'Growth',
    title: 'Help creators grow their account',
    body: 'Growth is still one of the biggest pain points. Better guidance here would make the whole platform more useful.',
    upvotes: 30,
    downvotes: 4,
  },
  {
    id: 'custom-domains',
    status: 'Under consideration',
    tag: 'Pro',
    title: 'Let creators connect their own domain later',
    body: 'A hosted page is a great start. A custom domain makes it feel more like a real business site.',
    upvotes: 24,
    downvotes: 2,
  },
]

function statusConfig(status: RoadmapCard['status']) {
  if (status === 'Shipped this week') {
    return {
      className: 'bg-[#efffd3] text-[#355400] border-[#dff3b3]',
      icon: BadgeCheck,
    }
  }

  if (status === 'Building now') {
    return {
      className: 'bg-[#fff6d8] text-[#6a5200] border-[#f4e1a0]',
      icon: Hammer,
    }
  }

  return {
    className: 'bg-[#f3f3ef] text-[#5f5f58] border-[#e4e4dd]',
    icon: Clock3,
  }
}

export default function HomeWaitlistLanding() {
  const [role, setRole] = useState<Role>('creator')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({})
  const [idea, setIdea] = useState('')
  const [ideaSubmitted, setIdeaSubmitted] = useState(false)
  const [ideaSubmitting, setIdeaSubmitting] = useState(false)
  const [ideaError, setIdeaError] = useState<string | null>(null)

  const content = useMemo(() => COPY[role], [role])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    ROADMAP_CARDS.forEach((card) => {
      const el = document.getElementById(`roadmap-card-${card.id}`)
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((current) => ({ ...current, [card.id]: true }))
              observer.disconnect()
            }
          })
        },
        { threshold: 0.18 }
      )

      observer.observe(el)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

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

  function getVoteCount(card: RoadmapCard, kind: 'up' | 'down') {
    const currentVote = votes[card.id] ?? null
    const base = kind === 'up' ? card.upvotes : card.downvotes

    if (kind === 'up') {
      if (currentVote === 'up') return base + 1
      return base
    }

    if (currentVote === 'down') return base + 1
    return base
  }

  async function handleIdeaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = idea.trim()
    if (!trimmed || ideaSubmitting) return

    setIdeaSubmitting(true)
    setIdeaError(null)

    try {
      const response = await fetch('/api/feedback/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: trimmed,
          role,
          email: typeof window !== 'undefined' ? window.localStorage.getItem('otto_waitlist_email') || null : null,
          page: 'home-roadmap',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setIdeaError(data?.error || 'Could not save your idea. Try again.')
        return
      }

      setIdeaSubmitted(true)
      setIdea('')
    } catch {
      setIdeaError('Could not save your idea. Try again.')
    } finally {
      setIdeaSubmitting(false)
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
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/85 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>Otto</span>
            <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
          </Link>
          <a href="#waitlist-form" className="btn-primary text-sm py-2 px-5">Get early access</a>
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

            <div className="mb-8 flex items-center justify-center">
              <fieldset className="inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white p-1.5 shadow-[0_4px_18px_rgba(28,28,30,0.06)]">
                <legend className="sr-only">Choose your role</legend>
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  aria-pressed={role === 'creator'}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${role === 'creator' ? 'bg-[#ccff00] text-[#1c1c1e]' : 'text-[#6b6b6b] hover:bg-[#f5f5f3]'}`}
                >
                  I&apos;m a creator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('brand')}
                  aria-pressed={role === 'brand'}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${role === 'brand' ? 'bg-[#ccff00] text-[#1c1c1e]' : 'text-[#6b6b6b] hover:bg-[#f5f5f3]'}`}
                >
                  I&apos;m a brand
                </button>
              </fieldset>
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
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a86]">Roadmap</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.4rem)] leading-[0.95] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
              What should we build next?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6b6b6b] md:text-base">
              Vote on ideas or suggest one.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {ROADMAP_CARDS.map((card) => {
              const vote = votes[card.id] ?? null
              const status = statusConfig(card.status)
              const StatusIcon = status.icon

              return (
                <article
                  key={card.id}
                  id={`roadmap-card-${card.id}`}
                  className="rounded-[28px] border border-[#e8e8e4] bg-white p-5 text-left shadow-[0_10px_30px_rgba(28,28,30,0.05)] transition-all duration-700 ease-out sm:p-6"
                  style={{
                    opacity: visibleCards[card.id] ? 1 : 0,
                    transform: visibleCards[card.id] ? 'translateY(0px) scale(1)' : 'translateY(24px) scale(0.985)',
                    transitionDelay: visibleCards[card.id] ? '0ms' : '0ms',
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
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
                      <span>{getVoteCount(card, 'up')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVote(card.id, 'down')}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${vote === 'down' ? 'border-[#f2d6d6] bg-[#fff3f3] text-[#8a2a2a]' : 'border-[#e8e8e4] bg-[#fcfcfa] text-[#4f4f49] hover:border-[#d9d9d2]'}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>{getVoteCount(card, 'down')}</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20 pt-8 md:px-10">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-[#e8e8e4] bg-white p-5 text-left shadow-[0_10px_30px_rgba(28,28,30,0.05)] sm:p-6">
            <h3 className="text-2xl font-semibold tracking-tight text-[#1c1c1e]">What do you want to see?</h3>
            <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">
              Add a feature idea, creator pain point, or workflow problem.
            </p>

            <form onSubmit={handleIdeaSubmit} className="mt-5 space-y-3">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Share an idea"
                className="min-h-[150px] w-full rounded-3xl border border-[#e8e8e4] bg-[#f8f8f5] px-5 py-4 text-sm text-[#1c1c1e] outline-none transition focus:border-[#ccff00]"
              />
              <button
                type="submit"
                disabled={ideaSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-[#1c1c1e] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: '#ccff00' }}
              >
                {ideaSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {ideaSubmitting ? 'Sending...' : 'Share idea'}
              </button>
            </form>

            {ideaError && <p className="mt-3 text-sm text-[#d14343]">{ideaError}</p>}
            {!ideaError && ideaSubmitted && (
              <p className="mt-3 text-sm text-[#5f5f5b]">Thanks. Added to the list.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
