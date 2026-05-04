'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Banknote, Bookmark, BriefcaseBusiness, ClipboardList, Copy, ExternalLink, RefreshCw, Send, Sparkles, WandSparkles } from 'lucide-react'
import { FALLBACK_HOOK_ROULETTE_ITEMS } from '@/lib/hook-roulette'

type Role = 'creator' | 'brand'

type ActivityItem = {
  id: string
  type: 'deal' | 'application' | 'message' | 'notification'
  title: string
  description: string
  created_at: string
  href: string
}

type CreatorDashboard = {
  activeDeals: {
    count: number
    items: Array<{
      id: string
      title: string
      brandName: string
      status: string
      value: number | null
    }>
  }
  applications: {
    count: number
    items: Array<{
      id: string
      jobId: string
      jobTitle: string
      brandName: string
      appliedAt: string
      status: string
    }>
  }
  opportunities: {
    count: number
    items: Array<{
      id: string
      title: string
      brandName: string
      budgetRange?: string | null
      timeline?: string | null
    }>
  }
  earnings: {
    total: number
    thisMonth: number
    pending: number
  }
  activity: ActivityItem[]
}

type BrandDashboard = {
  activeBriefs: {
    count: number
    items: Array<{
      id: string
      title: string
      status: string
      applicationCount: number
    }>
  }
  applicationsToReview: {
    count: number
    items: Array<{
      id: string
      jobId: string
      creatorId: string
      creatorName: string
      creatorAvatar: string | null
      jobTitle: string
      pitchSnippet: string
    }>
  }
  spend: {
    total: number
    thisMonth: number
  }
  activity: ActivityItem[]
}

type DashboardPayload = {
  role: Role
  welcomeName: string
  creator?: CreatorDashboard
  brand?: BrandDashboard
}

type HookRouletteIdea = {
  id: string
  hookStarter: string
  scriptAngle: string
  ctaBeat: string
  type?: string
  sourceUrl?: string
}

type SavedHookNote = {
  id: string
  text: string
  createdAt: string
}

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 650,
  fontSize: 'clamp(28px, 5vw, 42px)',
  lineHeight: 1.02,
  letterSpacing: '-1px',
  color: '#1c1c1e',
}

const HOOK_ROULETTE_IDEAS: HookRouletteIdea[] = FALLBACK_HOOK_ROULETTE_ITEMS.map((item) => ({
  id: item.id,
  hookStarter: item.hookText,
  scriptAngle: item.suggestedScriptAngle,
  ctaBeat: item.ctaBeat,
  type: item.type,
  sourceUrl: item.sourceUrl,
}))

const HOOK_NOTES_STORAGE_KEY = 'otto-hook-roulette-notes'

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-[#ccff00]/25 text-[#1c1c1e] border-[#d6ee76]',
  filled: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  closed: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  proposed: 'bg-sky-100 text-sky-700 border-sky-200',
  application_sent: 'bg-sky-100 text-sky-700 border-sky-200',
  under_review: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  offered: 'bg-violet-100 text-violet-700 border-violet-200',
  in_progress: 'bg-[#ccff00]/25 text-[#1c1c1e] border-[#d6ee76]',
  submitted: 'bg-violet-100 text-violet-700 border-violet-200',
  reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  complete: 'bg-zinc-100 text-zinc-700 border-zinc-200',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
        STATUS_STYLES[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '£0'
  return `£${value.toLocaleString()}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function randomFallbackHook(excludeId?: string | null): HookRouletteIdea {
  if (HOOK_ROULETTE_IDEAS.length < 2) return HOOK_ROULETTE_IDEAS[0]

  let next = HOOK_ROULETTE_IDEAS[Math.floor(Math.random() * HOOK_ROULETTE_IDEAS.length)]
  while (excludeId && next.id === excludeId) {
    next = HOOK_ROULETTE_IDEAS[Math.floor(Math.random() * HOOK_ROULETTE_IDEAS.length)]
  }

  return next
}

function toHookIdea(payload: unknown): HookRouletteIdea | null {
  if (!payload || typeof payload !== 'object') return null

  const item = payload as {
    id?: unknown
    hookStarter?: unknown
    scriptAngle?: unknown
    ctaBeat?: unknown
    type?: unknown
    sourceUrl?: unknown
  }

  if (typeof item.id !== 'string' || typeof item.hookStarter !== 'string' || typeof item.scriptAngle !== 'string' || typeof item.ctaBeat !== 'string') {
    return null
  }

  return {
    id: item.id,
    hookStarter: item.hookStarter,
    scriptAngle: item.scriptAngle,
    ctaBeat: item.ctaBeat,
    type: typeof item.type === 'string' ? item.type : undefined,
    sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : undefined,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [payload, setPayload] = useState<DashboardPayload | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [currentHookIdea, setCurrentHookIdea] = useState<HookRouletteIdea | null>(null)
  const [rollingHook, setRollingHook] = useState(false)
  const [savedHookNotes, setSavedHookNotes] = useState<SavedHookNote[]>([])
  const [hookFeedbackMessage, setHookFeedbackMessage] = useState('')
  const [hookSource, setHookSource] = useState<'db' | 'fallback'>('fallback')

  useEffect(() => {
    const onboarding = searchParams.get('onboarding')

    if (onboarding === 'creator') {
      const profileUrl = searchParams.get('profile')
      const handle = searchParams.get('handle')
      setSuccessMessage(
        profileUrl
          ? `Profile is live! Your portfolio page is at ${profileUrl}`
          : handle
            ? `Profile is live! Your portfolio page is at ottougc.com/${handle}`
            : 'Profile is live!'
      )
    } else if (onboarding === 'brand') {
      setSuccessMessage('Your brand profile is ready. Post your first job whenever you\'re ready.')
    } else {
      setSuccessMessage('')
    }

    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user

        if (!user) {
          router.replace('/login')
          return
        }

        const roleFromMetadata = user.user_metadata?.role
        if (roleFromMetadata === 'creator' || roleFromMetadata === 'brand') {
          setRole(roleFromMetadata)
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) {
          router.replace('/login')
          return
        }

        const response = await fetch('/api/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = (await response.json()) as DashboardPayload & { error?: string }

        if (!response.ok) {
          throw new Error(data.error || 'Could not load dashboard data.')
        }

        setPayload(data)
        setRole(data.role)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router, searchParams, supabase])

  const quickActions = useMemo(() => {
    if (role === 'brand') {
      return [
        { label: 'Post a brief', href: '/jobs/new', primary: true },
        { label: 'Discover creators', href: '/explore', primary: false },
      ]
    }

    return [
      { label: 'Live campaigns', href: '/live-campaigns', primary: true },
      { label: 'Find work', href: '/jobs', primary: false },
      { label: 'Update profile', href: '/profile/edit', primary: false },
      { label: 'View portfolio', href: '/portfolio', primary: false },
      { label: 'Edit portfolio', href: '/profile/edit?tab=portfolio', primary: false },
    ]
  }, [role])

  const fetchHookIdea = useCallback(async (excludeId?: string | null) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const response = await fetch('/api/creator/hooks/roulette?limit=3', {
        headers: token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : undefined,
      })

      if (!response.ok) throw new Error('Hook API unavailable')

      const data = (await response.json()) as {
        source?: 'db' | 'fallback'
        hooks?: unknown[]
      }

      const hooks = Array.isArray(data.hooks) ? data.hooks.map(toHookIdea).filter((item): item is HookRouletteIdea => Boolean(item)) : []

      if (!hooks.length) throw new Error('No hooks returned')

      const next = hooks.find((item) => item.id !== excludeId) || hooks[0]
      setCurrentHookIdea(next)
      setHookSource(data.source === 'db' ? 'db' : 'fallback')
      return true
    } catch {
      const fallback = randomFallbackHook(excludeId)
      setCurrentHookIdea(fallback)
      setHookSource('fallback')
      return false
    }
  }, [supabase])

  useEffect(() => {
    if (role !== 'creator') return

    setCurrentHookIdea((previous) => previous || randomFallbackHook())

    try {
      const raw = window.localStorage.getItem(HOOK_NOTES_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) return

      const safeNotes = parsed
        .filter((item): item is SavedHookNote => typeof item?.id === 'string' && typeof item?.text === 'string' && typeof item?.createdAt === 'string')
        .slice(0, 8)

      setSavedHookNotes(safeNotes)
    } catch {
      // Ignore malformed local data.
    }

    void fetchHookIdea()
  }, [fetchHookIdea, role])

  useEffect(() => {
    if (!hookFeedbackMessage) return

    const timer = window.setTimeout(() => {
      setHookFeedbackMessage('')
    }, 2400)

    return () => window.clearTimeout(timer)
  }, [hookFeedbackMessage])

  const rollHookIdea = () => {
    setRollingHook(true)

    window.setTimeout(async () => {
      await fetchHookIdea(currentHookIdea?.id || null)
      setRollingHook(false)
      setHookFeedbackMessage('New angle loaded.')
    }, 360)
  }

  const saveCurrentHookToNotes = () => {
    if (!currentHookIdea) return

    const noteText = `${currentHookIdea.hookStarter}\nAngle: ${currentHookIdea.scriptAngle}\nCTA beat: ${currentHookIdea.ctaBeat}`

    const nextNotes: SavedHookNote[] = [
      {
        id: `${Date.now()}-${currentHookIdea.id}`,
        text: noteText,
        createdAt: new Date().toISOString(),
      },
      ...savedHookNotes,
    ].slice(0, 8)

    setSavedHookNotes(nextNotes)
    window.localStorage.setItem(HOOK_NOTES_STORAGE_KEY, JSON.stringify(nextNotes))
    setHookFeedbackMessage('Saved to your hook notes.')
  }

  const copyHook = async () => {
    if (!currentHookIdea) return

    const payloadToCopy = `${currentHookIdea.hookStarter}\n\nScript angle: ${currentHookIdea.scriptAngle}\n\nCTA beat: ${currentHookIdea.ctaBeat}`

    try {
      await navigator.clipboard.writeText(payloadToCopy)
      setHookFeedbackMessage('Copied. Paste it into your script when you are ready.')
    } catch {
      setHookFeedbackMessage('Couldn’t copy automatically. You can still save it below.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const welcomeName = payload?.welcomeName || 'there'
  const creator = payload?.creator
  const brand = payload?.brand

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 pb-8 dashboard-compact">
      <div className="mb-8 overflow-hidden rounded-[28px] border border-[#ecece7] bg-[linear-gradient(135deg,#ffffff_0%,#fbfbf5_48%,#f4ffd7_100%)] p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label mb-3">{role === 'brand' ? 'Brand workspace' : 'Creator workspace'}</p>
            <h1 style={headlineStyle}>Welcome back, {welcomeName}</h1>
            <p className="text-sm text-[#5f5f5b] mt-3 max-w-2xl">
              {role === 'brand'
                ? 'Review the work that needs a decision, keep briefs moving, and spot creators worth inviting back.'
                : 'Keep today focused: check live work, follow up on applications, and save a strong hook before you film.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            {role === 'creator' && creator ? (
              <>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <BriefcaseBusiness className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">Active deals</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{creator.activeDeals.count}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <Send className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">Applications</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{creator.applications.count}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <Sparkles className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">Open matches</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{creator.opportunities.count}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <Banknote className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">Pending</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{formatMoney(creator.earnings.pending)}</p>
                </div>
              </>
            ) : role === 'brand' && brand ? (
              <>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <ClipboardList className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">Active briefs</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{brand.activeBriefs.count}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <Send className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">To review</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{brand.applicationsToReview.count}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/80 bg-white/75 p-3 shadow-[0_1px_0_rgba(28,28,30,0.04)]">
                  <Banknote className="mb-2 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-[11px] text-[#77736d]">Campaign spend</p>
                  <p className="mt-1 text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{formatMoney(brand.spend.total)}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-5 rounded-xl border border-[#d7ec8a] bg-[#f7ffd4] p-4 text-sm font-medium text-[#1c1c1e]">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className={action.primary ? 'btn-primary' : 'btn-ghost'}>
            {action.label}
          </Link>
        ))}
      </div>

      {role === 'creator' && creator && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="overflow-hidden rounded-[30px] border border-[#e6e6de] bg-white shadow-[0_18px_55px_rgba(28,28,30,0.08)] lg:col-span-2">
            <div className="border-b border-[#eeeeea] bg-[radial-gradient(circle_at_top_left,rgba(204,255,0,0.22),transparent_34%),linear-gradient(135deg,#ffffff_0%,#fbfbf6_60%,#f3f3ec_100%)] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e6efbf] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#69733f]">
                  <WandSparkles className="h-3.5 w-3.5" />
                  Hook lab
                </div>
                <h2 className="text-[26px] leading-tight text-[#1c1c1e] md:text-[30px]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.8px' }}>
                  Shape the first line before you film
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f5b]">
                  Pick a natural opener, tighten the angle, then move. This should feel like a scratchpad, not another content machine.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={rollHookIdea} disabled={rollingHook} className="btn-primary inline-flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${rollingHook ? 'animate-spin' : ''}`} />
                  {rollingHook ? 'Loading…' : 'New hook'}
                </button>
                <button type="button" onClick={saveCurrentHookToNotes} className="btn-ghost inline-flex items-center gap-2 border border-[#e8e8e4]">
                  <Bookmark className="h-4 w-4" />
                  Save
                </button>
                <button type="button" onClick={copyHook} className="btn-ghost inline-flex items-center gap-2 border border-[#e8e8e4]">
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>

            </div>
            <div className="p-5 md:p-6">
              <div className={`rounded-[24px] border border-[#e6efbf] bg-[#fbffdf] p-4 transition-all duration-300 md:p-5 ${rollingHook ? 'opacity-60 scale-[0.995]' : 'opacity-100 scale-100'}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78834a]">Hook starter</p>
              <p className="mt-2 text-lg font-semibold text-[#1c1c1e]">
                {currentHookIdea?.hookStarter || 'Load a hook to start shaping your opener.'}
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center justify-between gap-2 text-[11px] text-[#7d7d78]">
                  <span className="uppercase tracking-[0.12em]">{hookSource === 'db' ? 'Live hook database' : 'Fallback hook bank'}</span>
                  {currentHookIdea?.sourceUrl ? (
                    <a href={currentHookIdea.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-[#4b5d00]">
                      Source
                    </a>
                  ) : null}
                </div>
                <div className="rounded-xl border border-[#e3eac2] bg-white/75 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d7d78]">Script angle</p>
                  <p className="mt-2 text-sm text-[#363535]">{currentHookIdea?.scriptAngle || '—'}</p>
                </div>
                <div className="rounded-xl border border-[#e3eac2] bg-white/75 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d7d78]">CTA beat</p>
                  <p className="mt-2 text-sm text-[#363535]">{currentHookIdea?.ctaBeat || '—'}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-[#8a8a86]">Keep it simple: pick the line that sounds most natural, then film before you overwork it.</p>
              <p className="text-xs font-medium text-[#4b5d00] min-h-[18px]">{hookFeedbackMessage}</p>
            </div>

            {savedHookNotes.length > 0 && (
              <div className="mt-4 rounded-2xl border border-[#efefea] bg-[#fcfcfb] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a8a86]">Recent notes</p>
                  <span className="text-[11px] text-[#9a9a9a]">Stored on this device</span>
                </div>
                <div className="space-y-2">
                  {savedHookNotes.slice(0, 3).map((note) => (
                    <div key={note.id} className="rounded-xl border border-[#ecece8] bg-white p-3">
                      <p className="whitespace-pre-wrap text-sm text-[#363535] line-clamp-3">{note.text}</p>
                      <p className="mt-2 text-[11px] text-[#9a9a9a]">Saved {formatDate(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
            </div>
          </section>

          <section className="card shadow-sm">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">Active deals</p>
                <p className="text-3xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{creator.activeDeals.count}</p>
              </div>
              <Link href="/deals" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] hover:text-[#1c1c1e]">
                View all
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {creator.activeDeals.items.length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No active deals yet.</p>
              ) : (
                creator.activeDeals.items.map((deal) => (
                  <div key={deal.id} className="rounded-xl border border-[#efefea] bg-[#fafaf9] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-[#1c1c1e]">{deal.title}</p>
                        <p className="text-xs text-[#6b6b6b] mt-0.5">{deal.brandName} · {formatMoney(deal.value)}</p>
                      </div>
                      <StatusBadge status={deal.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card shadow-sm">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">Earnings</p>
                <p className="text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{formatMoney(creator.earnings.total)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#fafaf9] border border-[#efefea] p-3">
                <p className="text-[11px] text-[#6b6b6b]">This month</p>
                <p className="text-sm font-semibold text-[#1c1c1e] mt-1">{formatMoney(creator.earnings.thisMonth)}</p>
              </div>
              <div className="rounded-xl bg-[#fafaf9] border border-[#efefea] p-3 col-span-2">
                <p className="text-[11px] text-[#6b6b6b]">Pending payment</p>
                <p className="text-sm font-semibold text-[#1c1c1e] mt-1">{formatMoney(creator.earnings.pending)}</p>
              </div>
            </div>
          </section>

          <section className="card shadow-sm">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">Applications sent</p>
                <p className="text-3xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{creator.applications.count}</p>
              </div>
              <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] hover:text-[#1c1c1e]">
                Find work
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {creator.applications.items.length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No applications sent yet.</p>
              ) : (
                creator.applications.items.map((application) => (
                  <div key={application.id} className="rounded-xl border border-[#efefea] bg-[#fafaf9] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-[#1c1c1e]">{application.jobTitle}</p>
                        <p className="text-xs text-[#6b6b6b] mt-0.5">{application.brandName} · Applied {formatDate(application.appliedAt)}</p>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card shadow-sm">
            <p className="section-label mb-1">Activity feed</p>
            <div className="space-y-3">
              {(creator.activity || []).length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No recent activity.</p>
              ) : (
                creator.activity.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-xl border border-[#efefea] bg-[#fafaf9] p-3 hover:border-[#e2e2dc] transition-colors">
                    <p className="text-sm font-semibold text-[#1c1c1e]">{item.title}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-[11px] text-[#a0a09c] mt-1.5">{formatDate(item.created_at)}</p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="card shadow-sm lg:col-span-2">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">New opportunities</p>
                <p className="text-sm text-[#6b6b6b]">Recent open jobs matching your niche and platforms</p>
              </div>
              <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] hover:text-[#1c1c1e]">
                Browse all
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {creator.opportunities.items.length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No opportunities right now.</p>
              ) : (
                creator.opportunities.items.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-xl border border-[#efefea] bg-[#fafaf9] p-3 hover:border-[#e2e2dc] transition-colors">
                    <p className="font-semibold text-sm text-[#1c1c1e]">{job.title}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1">{job.brandName}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1">{job.budgetRange || 'Budget TBD'} · {job.timeline || 'Flexible timeline'}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {role === 'brand' && brand && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="card shadow-sm">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">Active briefs</p>
                <p className="text-3xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{brand.activeBriefs.count}</p>
              </div>
              <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6b6b] hover:text-[#1c1c1e]">
                Manage briefs
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {brand.activeBriefs.items.length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No active briefs yet.</p>
              ) : (
                brand.activeBriefs.items.map((brief) => (
                  <div key={brief.id} className="rounded-xl border border-[#efefea] bg-[#fafaf9] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-[#1c1c1e]">{brief.title}</p>
                        <p className="text-xs text-[#6b6b6b] mt-0.5">{brief.applicationCount} applications</p>
                      </div>
                      <StatusBadge status={brief.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card shadow-sm">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">Campaign spend</p>
                <p className="text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{formatMoney(brand.spend.total)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-[#fafaf9] border border-[#efefea] p-3">
              <p className="text-[11px] text-[#6b6b6b]">This month</p>
              <p className="text-sm font-semibold text-[#1c1c1e] mt-1">{formatMoney(brand.spend.thisMonth)}</p>
            </div>
          </section>

          <section className="card shadow-sm lg:col-span-2">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="section-label mb-1">Applications to review</p>
                <p className="text-3xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{brand.applicationsToReview.count}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brand.applicationsToReview.items.length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No pending applications right now.</p>
              ) : (
                brand.applicationsToReview.items.map((application) => (
                  <div key={application.id} className="rounded-xl border border-[#efefea] bg-[#fafaf9] p-3">
                    <div className="flex items-start gap-3">
                      {application.creatorAvatar ? (
                        <img src={application.creatorAvatar} alt={application.creatorName} className="w-10 h-10 rounded-full object-cover border border-[#ecece7]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#ecece7] text-[#6b6b6b] text-xs font-semibold flex items-center justify-center">
                          {application.creatorName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1c1c1e] truncate">{application.creatorName}</p>
                        <p className="text-xs text-[#6b6b6b] truncate">{application.jobTitle}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1 line-clamp-2">{application.pitchSnippet || 'No pitch text provided.'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/jobs/${application.jobId}/manage`} className="btn-ghost text-xs px-3 py-1.5">Review</Link>
                      <Link href={`/jobs/new?invite=${application.creatorId}`} className="btn-primary text-xs px-3 py-1.5">Invite</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card shadow-sm lg:col-span-2">
            <p className="section-label mb-1">Activity feed</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(brand.activity || []).length === 0 ? (
                <p className="text-sm text-[#6b6b6b]">No recent activity.</p>
              ) : (
                brand.activity.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-xl border border-[#efefea] bg-[#fafaf9] p-3 hover:border-[#e2e2dc] transition-colors">
                    <p className="text-sm font-semibold text-[#1c1c1e]">{item.title}</p>
                    <p className="text-xs text-[#6b6b6b] mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-[11px] text-[#a0a09c] mt-1.5">{formatDate(item.created_at)}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
