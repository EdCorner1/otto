'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Caveat } from 'next/font/google'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, ChevronRight, Clock3, DollarSign, Hammer, Loader2, MessageSquare, Play, ShieldAlert, Target, ThumbsDown, ThumbsUp, Users } from 'lucide-react'

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

const accentScript = Caveat({
  subsets: ['latin'],
  weight: ['700'],
})

const FEATURED_INTRO_VIDEOS = [
  { id: 'v1', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/Fit2YLf3rS0/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=Fit2YLf3rS0' },
  { id: 'v2', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/i8oyR0lMFzE/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=i8oyR0lMFzE' },
  { id: 'v3', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/_tvedFUQmSM/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=_tvedFUQmSM' },
  { id: 'v4', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/9w-zDHGobWI/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=9w-zDHGobWI' },
  { id: 'v5', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/ECrA05A1gHc/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=ECrA05A1gHc' },
  { id: 'v6', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/NsLKQTh-Bqo/hqdefault.jpg', url: 'https://www.youtube.com/shorts/NsLKQTh-Bqo' },
  { id: 'v7', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/F-X4SLhorvw/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=F-X4SLhorvw' },
  { id: 'v8', title: 'Classic funny clip', thumbnail: 'https://img.youtube.com/vi/pEMbqEKXG3Y/hqdefault.jpg', url: 'https://www.youtube.com/shorts/pEMbqEKXG3Y' },
] as const

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
    tag: 'Content tools',
    title: 'Help creators improve content and engagement',
    body: 'A light-touch coach could help with hooks, positioning, and growth while keeping the creator’s voice intact.',
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

  async function setVote(cardId: string, value: Vote) {
    let resolvedVote: Vote = null

    setVotes((current) => {
      resolvedVote = current[cardId] === value ? null : value
      return {
        ...current,
        [cardId]: resolvedVote,
      }
    })

    try {
      await fetch('/api/feedback/roadmap-reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          vote: resolvedVote || 'none',
          role,
          email: typeof window !== 'undefined' ? window.localStorage.getItem('otto_waitlist_email') || null : null,
          page: 'home-roadmap',
        }),
      })
    } catch {
      // Keep UI responsive even if reaction logging fails.
    }
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
        <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 pt-28 pb-20 md:px-10">
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

        <section className="mx-auto max-w-6xl px-6 pb-12 md:px-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[clamp(1.3rem,2vw,1.9rem)] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
              {role === 'creator' ? 'Your content could be here next' : "Here's some of our favourite creators"}
            </h2>
            <a href="#waitlist-form" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1c1c1e] hover:text-[#4b4b46]">
              Get access
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="overflow-hidden py-2">
            <div className="video-ticker-track flex gap-5">
              {[...FEATURED_INTRO_VIDEOS, ...FEATURED_INTRO_VIDEOS].map((video, index) => (
                <a
                  key={`${video.id}-${index}`}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-[250px] shrink-0 overflow-hidden rounded-2xl border border-[#ecece8] bg-white shadow-[0_14px_32px_rgba(28,28,30,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(28,28,30,0.12)]"
                  aria-label="Play video"
                >
                  <div className="relative aspect-[9/16]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnail} alt={`${video.title} thumbnail`} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#1c1c1e] shadow-md transition group-hover:scale-105">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    </span>
                  </div>
                  <div className="p-1" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
          <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a86]">Product roadmap</p>
              <h2 className="mt-2 text-[clamp(2rem,4.8vw,3.6rem)] leading-[0.94] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.045em' }}>
                What we&apos;re building next
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6b6b] md:text-base">
                We&apos;re shipping the essentials first: stronger onboarding, cleaner creator portfolios, and smoother brand workflows.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {ROADMAP_CARDS.map((card, index) => {
              const status = statusConfig(card.status)
              const StatusIcon = status.icon
              const vote = votes[card.id] ?? null
              const isVisible = visibleCards[card.id]

              return (
                <article
                  key={card.id}
                  id={`roadmap-card-${card.id}`}
                  className={`rounded-[24px] border border-[#e8e8e4] bg-white p-5 shadow-[0_10px_28px_rgba(28,28,30,0.05)] transition duration-500 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 35}ms` }}
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {card.status}
                    </span>
                    <span className="rounded-full bg-[#f4f4ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5f5f58]">{card.body}</p>

                  <div className="mt-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVote(card.id, 'up')}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${vote === 'up' ? 'border-[#ccff00] bg-[#f4ffcf] text-[#355400]' : 'border-[#e4e4dd] bg-[#fafaf8] text-[#5f5f58] hover:border-[#ccff00]'}`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {getVoteCount(card, 'up')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVote(card.id, 'down')}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${vote === 'down' ? 'border-[#ffd8d8] bg-[#fff3f3] text-[#8d3838]' : 'border-[#e4e4dd] bg-[#fafaf8] text-[#5f5f58] hover:border-[#ffd8d8]'}`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {getVoteCount(card, 'down')}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-8 rounded-[26px] border border-[#e8e8e4] bg-white p-6 shadow-[0_10px_30px_rgba(28,28,30,0.05)] sm:p-7">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4ffcf] text-[#3f6a00]">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8a86]">What do you want to see?</p>
                <h3 className="mt-1 text-[clamp(1.5rem,3.2vw,2.2rem)] leading-[0.95] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                  Share your product idea
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b6b]">Tell us what would make Otto more useful for your workflow.</p>
              </div>
            </div>

            {ideaSubmitted ? (
              <div className="mt-5 rounded-2xl border border-[#d6efaa] bg-[#f4ffdf] px-4 py-3 text-sm font-medium text-[#355400]">
                Thanks — your idea has been added.
              </div>
            ) : (
              <form onSubmit={handleIdeaSubmit} className="mt-5 space-y-3">
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  placeholder="Example: a faster way to shortlist creators by niche, budget, and style"
                  className="w-full rounded-2xl border border-[#e8e8e4] bg-[#fafaf8] px-4 py-3 text-sm text-[#1c1c1e] outline-none transition focus:border-[#ccff00]"
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-[#8a8a86]">Keep it specific — what problem should Otto solve next?</p>
                  <button
                    type="submit"
                    disabled={ideaSubmitting || idea.trim().length < 6}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
                  >
                    {ideaSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {ideaSubmitting ? 'Sending…' : 'Submit idea'}
                  </button>
                </div>
                {ideaError && <p className="text-sm text-[#d14343]">{ideaError}</p>}
              </form>
            )}
          </div>
        </section>

        {role === 'creator' && (
        <>
        <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mt-2 text-[clamp(2.2rem,5vw,4.2rem)] leading-[0.95] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
              Creating content that{' '}
              <span className={`${accentScript.className} inline-block text-[#ccff00] text-[1.08em] align-baseline`}>gets</span>{' '}
              <span className={`${accentScript.className} inline-block text-[#ccff00] text-[1.08em] align-baseline`}>clicks</span>{' '}
              is hard when the workflow is broken
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#6b6b6b] md:text-xl md:leading-8">
              Most creators and brand teams don&apos;t struggle because they&apos;re not trying hard enough. They struggle because the process is messy.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-[28px] border border-[#ecece8] bg-white p-4 shadow-[0_10px_30px_rgba(28,28,30,0.05)]">
              <div className="relative h-64 overflow-hidden rounded-2xl border border-[#efefe9] bg-gradient-to-br from-[#f6f6f2] to-[#fff9fc] p-4">
                <div className="flex h-full flex-col justify-between rounded-xl border border-[#e7e7e0] bg-white p-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4f8] text-[#8a2a4a]">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-2/3 rounded-full bg-[#ecece7]" />
                    <div className="h-3 w-1/2 rounded-full bg-[#ecece7]" />
                    <div className="inline-flex rounded-full border border-[#ffd8e5] bg-[#fff4f8] px-3 py-1 text-xs font-semibold text-[#8a2a4a]">Back-and-forth pricing</div>
                  </div>
                </div>
              </div>
              <h3 className="mt-5 text-3xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                Built for tech, AI, and app creators
              </h3>
            </article>

            <article className="rounded-[28px] border border-[#ecece8] bg-white p-4 shadow-[0_10px_30px_rgba(28,28,30,0.05)]">
              <div className="relative h-64 overflow-hidden rounded-2xl border border-[#efefe9] bg-gradient-to-br from-[#f6f6f2] to-[#fff9fc] p-4">
                <div className="flex h-full flex-col justify-between rounded-xl border border-[#e7e7e0] bg-white p-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef8ff] text-[#2d5f87]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex -space-x-2">
                      <span className="h-8 w-8 rounded-full border-2 border-white bg-[#dfeef9]" />
                      <span className="h-8 w-8 rounded-full border-2 border-white bg-[#f9e5ef]" />
                      <span className="h-8 w-8 rounded-full border-2 border-white bg-[#e8f4de]" />
                    </div>
                    <div className="inline-flex rounded-full border border-[#d8e8f4] bg-[#f3f9ff] px-3 py-1 text-xs font-semibold text-[#2d5f87]">Niche mismatch</div>
                  </div>
                </div>
              </div>
              <h3 className="mt-5 text-3xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                Better creator-brand matches with less pitching
              </h3>
            </article>

            <article className="rounded-[28px] border border-[#ecece8] bg-white p-4 shadow-[0_10px_30px_rgba(28,28,30,0.05)]">
              <div className="relative h-64 overflow-hidden rounded-2xl border border-[#efefe9] bg-gradient-to-br from-[#f6f6f2] to-[#fff9fc] p-4">
                <div className="flex h-full flex-col justify-between rounded-xl border border-[#e7e7e0] bg-white p-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4f8] text-[#8a2a4a]">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-9 rounded-xl border border-[#ecece7] bg-[#fafaf8]" />
                    <div className="h-9 rounded-xl border border-[#ecece7] bg-[#fafaf8]" />
                    <div className="inline-flex rounded-full border border-[#ffd8e5] bg-[#fff4f8] px-3 py-1 text-xs font-semibold text-[#8a2a4a]">Weak creative direction</div>
                  </div>
                </div>
              </div>
              <h3 className="mt-5 text-3xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                Build content ideas faster with script support in your dashboard
              </h3>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14 md:px-10">
          <div className="grid items-center gap-8 rounded-[30px] border border-[#ecece8] bg-white p-6 shadow-[0_10px_30px_rgba(28,28,30,0.05)] lg:grid-cols-[1.15fr_1fr] lg:p-8">
            <div>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[0.95] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                Show off your best work
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#6b6b6b] md:text-base">
                Every creator profile includes a clean public portfolio page you can share with brands right away.
              </p>
              <a href="#waitlist-form" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ccff00] px-5 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]">
                Get access
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#ecece8] bg-[#f9f9f6] p-2 shadow-sm">
              <div className="relative h-56 overflow-hidden rounded-xl border border-[#ecece8]">
                <Image src="/images/creator-portfolio-live.png" alt="Live creator portfolio preview" fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover object-top" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14 md:px-10">
          <div className="rounded-[30px] border border-[#ecece8] bg-white p-6 shadow-[0_10px_30px_rgba(28,28,30,0.05)] sm:p-8">
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[0.95] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
              3 ways to get paid
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6b6b6b] md:text-base">
              Simple earning models creators can use with brands depending on campaign goals.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[#ecece8] bg-[#fcfcfa] p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5fbe7] text-[#4d6d10]">
                  <Play className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-2xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                  Pay per video
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5f5f58]">One clear rate for each approved video deliverable.</p>
              </article>

              <article className="rounded-2xl border border-[#ecece8] bg-[#fcfcfa] p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef7ff] text-[#2d5f87]">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-2xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                  Monthly retainer
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5f5f58]">Steady monthly content output for brands that want consistency.</p>
              </article>

              <article className="rounded-2xl border border-[#ecece8] bg-[#fcfcfa] p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4f8] text-[#8a2a4a]">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-2xl leading-tight text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                  Pay per video + performance bonuses
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5f5f58]">Base video fee with upside tied to agreed view milestones.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
          <div className="rounded-[34px] border border-[#d7f28f] bg-[#ccff00] px-6 py-10 text-center shadow-[0_18px_45px_rgba(204,255,0,0.35)] sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3f5200]">Creator access</p>
            <h2 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] leading-[0.92] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
              Stop waiting. Start getting paid for content that brands actually want.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#3f5200] md:text-base">
              If you&apos;re serious about turning your content into real income, join the waitlist and get in early.
            </p>
            <a href="#waitlist-form" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1c1c1e] px-8 py-4 text-base font-semibold text-white transition hover:bg-black">
              I want this
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>
        </section>
        </>
        )}
      </main>

      <style jsx global>{`
        .video-ticker-track {
          width: max-content;
          animation: videoTicker 42s linear infinite;
        }

        .video-ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes videoTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
