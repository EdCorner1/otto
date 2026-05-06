'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CircleDot,
  DollarSign,
  Eye,
  Film,
  Link2,
  Loader2,
  MessageSquareQuote,
  Plus,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { LiveCampaignLogStatus, LiveCampaignPlatform } from '@/lib/live-campaigns'

type CampaignStatus = 'on_track' | 'behind' | 'not_started'

type CampaignLog = {
  id: string
  deal_id: string
  client_name: string
  platform: LiveCampaignPlatform
  video_url: string
  views: number
  date: string
  created_at: string
  status: LiveCampaignLogStatus
  notes: {
    hook: string
    concept: string
    context: string
  }
}

type CampaignCard = {
  id: string
  client_name: string
  avatar_url: string | null
  amount: number
  status: string
  start_date: string
  contract_days: number
  daily_target: number
  monthly_rate: number
  platforms: LiveCampaignPlatform[]
  days_active: number
  videos_today: number
  videos_this_week: number
  videos_this_month: number
  views_this_month: number
  total_videos: number
  total_views: number
  earned_prorated: number
  monthly_target_to_date: number
  progress_percent: number
  campaign_status: CampaignStatus
  logs: Omit<CampaignLog, 'deal_id' | 'client_name'>[]
}

type LiveCampaignsPayload = {
  summary: {
    total_clients: number
    total_videos_posted: number
    total_views: number
    total_earned: number
  }
  campaigns: CampaignCard[]
  content_log: CampaignLog[]
}

type LogFormState = {
  platform: LiveCampaignPlatform
  video_url: string
  views: string
  date: string
  status: LiveCampaignLogStatus
  notes: {
    hook: string
    concept: string
    context: string
  }
}

const PLATFORM_COLORS: Record<LiveCampaignPlatform, string> = {
  TikTok: 'bg-[#111111] text-white',
  Instagram: 'bg-[#fff1f6] text-[#c13584]',
  YouTube: 'bg-[#fff1f0] text-[#ff0000]',
  LinkedIn: 'bg-[#eef6ff] text-[#0a66c2]',
}

const STATUS_STYLES: Record<CampaignStatus, { label: string; dotClass: string; bar: string; chip: string }> = {
  on_track: {
    label: 'On Track',
    dotClass: 'fill-[#84cc16] text-[#84cc16]',
    bar: '#ccff00',
    chip: 'bg-[#f5ffd9] text-[#2d3a00] border-[#dcef8b]',
  },
  behind: {
    label: 'Behind',
    dotClass: 'fill-[#ef4444] text-[#ef4444]',
    bar: '#ef4444',
    chip: 'bg-[#fff1f1] text-[#a61b1b] border-[#fecaca]',
  },
  not_started: {
    label: 'Not Started',
    dotClass: 'fill-[#d6d3d1] text-[#d6d3d1]',
    bar: '#d6d3d1',
    chip: 'bg-[#f5f5f4] text-[#57534e] border-[#e7e5e4]',
  },
}

const LOG_STATUS_META: Record<LiveCampaignLogStatus, { label: string; chip: string }> = {
  drafted: { label: 'Drafted', chip: 'border-[#e5e7eb] bg-white text-[#57534e]' },
  posted: { label: 'Posted', chip: 'border-[#bbf7d0] bg-[#ecfdf3] text-[#166534]' },
  sent_for_approval: { label: 'Sent for approval', chip: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]' },
  approved: { label: 'Approved', chip: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDate(value: string, withYear = false) {
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

function startOfTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">{label}</p>
          <p className="text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{value}</p>
          <p className="mt-2 text-sm text-[#6b6b6b]">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7fbe7] text-[#1c1c1e]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const tones = {
    default: 'border-[#f1f1ec] bg-[#fafaf9] text-[#1c1c1e]',
    success: 'border-[#bbf7d0] bg-[#ecfdf3] text-[#166534]',
    warning: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
    danger: 'border-[#fecaca] bg-[#fff1f1] text-[#a61b1b]',
  } as const

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

export default function LiveCampaignsPage() {
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<LiveCampaignsPayload | null>(null)
  const [openDealId, setOpenDealId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [formState, setFormState] = useState<Record<string, LogFormState>>({})

  const loadCampaigns = useCallback(async () => {
    try {
      setError('')
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please log in again.')

      const response = await fetch('/api/live-campaigns', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load live campaigns.')

      const nextPayload = data as LiveCampaignsPayload
      setPayload(nextPayload)
      setFormState((current) => {
        const next = { ...current }
        for (const campaign of nextPayload.campaigns) {
          if (!next[campaign.id]) {
            next[campaign.id] = {
              platform: campaign.platforms[0] || 'TikTok',
              video_url: '',
              views: '',
              date: startOfTodayKey(),
              status: 'posted',
              notes: {
                hook: '',
                concept: '',
                context: '',
              },
            }
          }
        }
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load live campaigns.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  useEffect(() => {
    const requestedDealId = searchParams.get('log')
    if (!requestedDealId || !payload?.campaigns.some((campaign) => campaign.id === requestedDealId)) return
    setOpenDealId(requestedDealId)
  }, [payload, searchParams])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>, dealId: string) => {
    event.preventDefault()
    const draft = formState[dealId]
    if (!draft) return

    try {
      setSubmitting(dealId)
      setError('')

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please log in again.')

      const response = await fetch('/api/live-campaigns/log', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deal_id: dealId,
          platform: draft.platform,
          video_url: draft.video_url,
          views: Number(draft.views || 0),
          date: draft.date,
          status: draft.status,
          notes: draft.notes,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save content log.')

      setFormState((current) => ({
        ...current,
        [dealId]: {
          ...current[dealId],
          video_url: '',
          views: '',
          date: startOfTodayKey(),
          status: 'posted',
          notes: {
            hook: '',
            concept: '',
            context: '',
          },
        },
      }))

      await loadCampaigns()
      setOpenDealId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save content log.')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const summary = payload?.summary
  const campaigns = payload?.campaigns || []
  const contentLog = payload?.content_log || []

  return (
    <div className="mx-auto max-w-7xl px-2 md:px-4 pb-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-bricolage)',
              fontWeight: 650,
              fontSize: 'clamp(30px, 5vw, 48px)',
              lineHeight: 1.02,
              letterSpacing: '-2px',
              color: '#1c1c1e',
            }}
          >
            Live Campaigns
          </h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Track active retainers, daily posting pace, and logged content in one place.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total clients"
          value={String(summary?.total_clients || 0)}
          hint="Active monthly retainers seeded from Ed's creator deals"
          icon={<Target className="h-5 w-5" />}
        />
        <SummaryCard
          label="Videos posted"
          value={formatNumber(summary?.total_videos_posted || 0)}
          hint="Only posted + approved content counts toward pacing"
          icon={<Film className="h-5 w-5" />}
        />
        <SummaryCard
          label="Views this month"
          value={formatNumber(summary?.total_views || 0)}
          hint="Running total from posted and approved content logs"
          icon={<Eye className="h-5 w-5" />}
        />
        <SummaryCard
          label="Total earned"
          value={formatCurrency(summary?.total_earned || 0)}
          hint="Prorated based on elapsed campaign days"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {campaigns.map((campaign) => {
          const status = STATUS_STYLES[campaign.campaign_status]
          const isOpen = openDealId === campaign.id
          const draft = formState[campaign.id]
          const postedTargetLabel = `${campaign.videos_this_month}/${campaign.monthly_target_to_date || campaign.daily_target}`
          const draftCount = campaign.logs.filter((log) => log.status === 'drafted').length
          const awaitingCount = campaign.logs.filter((log) => log.status === 'sent_for_approval').length
          const approvedCount = campaign.logs.filter((log) => log.status === 'approved').length
          const latestLog = campaign.logs[0] || null

          return (
            <section key={campaign.id} className="card shadow-sm">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {campaign.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={campaign.avatar_url} alt={campaign.client_name} className="h-14 w-14 rounded-2xl border border-[#ecece8] object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1c1c1e] text-lg font-semibold text-white">
                        {campaign.client_name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{campaign.client_name}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#6b6b6b]">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Started {formatDate(campaign.start_date)}</span>
                        <span>•</span>
                        <span>{campaign.days_active} day{campaign.days_active === 1 ? '' : 's'} active</span>
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${status.chip}`}>
                    <CircleDot className={`h-3.5 w-3.5 ${status.dotClass}`} />
                    <span>{status.label}</span>
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <span key={platform} className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${PLATFORM_COLORS[platform]}`}>
                        {platform} · 1/day
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[#6b6b6b]">
                    1 repurposed video per platform each day — {campaign.daily_target} posts/day total.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric label="Videos today" value={formatNumber(campaign.videos_today)} />
                  <Metric label="This week" value={formatNumber(campaign.videos_this_week)} />
                  <Metric label="This month" value={formatNumber(campaign.videos_this_month)} />
                  <Metric label="Views this month" value={formatNumber(campaign.views_this_month)} />
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <Metric label="Monthly rate" value={formatCurrency(campaign.monthly_rate)} />
                  <Metric label="Earned so far" value={formatCurrency(campaign.earned_prorated)} />
                  <Metric label="Posts vs target" value={postedTargetLabel} />
                  <Metric label="Drafts" value={String(draftCount)} tone={draftCount > 0 ? 'warning' : 'default'} />
                  <Metric label="Awaiting approval" value={String(awaitingCount)} tone={awaitingCount > 0 ? 'warning' : 'default'} />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-[#6b6b6b]">
                    <span>Progress to date</span>
                    <span>{campaign.progress_percent}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#f1f1ec]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${campaign.progress_percent}%`, backgroundColor: status.bar }}
                    />
                  </div>
                </div>

                {latestLog ? (
                  <div className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${PLATFORM_COLORS[latestLog.platform]}`}>{latestLog.platform}</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${LOG_STATUS_META[latestLog.status].chip}`}>
                        {LOG_STATUS_META[latestLog.status].label}
                      </span>
                      <span className="text-xs text-[#9a9a9a]">Latest log · {formatDate(latestLog.date, true)}</span>
                      {approvedCount > 0 ? <span className="text-xs text-[#9a9a9a]">• {approvedCount} approved</span> : null}
                    </div>
                    {(latestLog.notes.hook || latestLog.notes.concept || latestLog.notes.context) ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Hook</p>
                          <p className="mt-2 text-sm text-[#363535] line-clamp-2">{latestLog.notes.hook || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Concept</p>
                          <p className="mt-2 text-sm text-[#363535] line-clamp-2">{latestLog.notes.concept || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Context</p>
                          <p className="mt-2 text-sm text-[#363535] line-clamp-2">{latestLog.notes.context || '—'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[#6b6b6b]">No hook, concept, or context notes logged on the latest entry yet.</p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setOpenDealId(isOpen ? null : campaign.id)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Log content
                  </button>
                  <Link
                    href={`/live-campaigns/${campaign.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:-translate-y-0.5 hover:border-[#d7d7d2]"
                  >
                    Open campaign overview
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="text-sm text-[#6b6b6b]">
                    {campaign.total_videos} total posted/approved videos · {formatNumber(campaign.total_views)} total views
                  </div>
                </div>

                {isOpen && draft && (
                  <form onSubmit={(event) => handleSubmit(event, campaign.id)} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="text-sm text-[#363535]">
                        <span className="mb-2 block font-medium">Platform</span>
                        <select
                          value={draft.platform}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], platform: event.target.value as LiveCampaignPlatform },
                          }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                        >
                          {campaign.platforms.map((platform) => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm text-[#363535]">
                        <span className="mb-2 block font-medium">Status</span>
                        <select
                          value={draft.status}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], status: event.target.value as LiveCampaignLogStatus },
                          }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                        >
                          <option value="drafted">Drafted</option>
                          <option value="posted">Posted</option>
                          <option value="sent_for_approval">Sent for approval</option>
                          <option value="approved">Approved</option>
                        </select>
                      </label>

                      <label className="text-sm text-[#363535]">
                        <span className="mb-2 block font-medium">Views</span>
                        <input
                          type="number"
                          min="0"
                          value={draft.views}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], views: event.target.value },
                          }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                          placeholder="2400"
                        />
                      </label>

                      <label className="text-sm text-[#363535]">
                        <span className="mb-2 block font-medium">Date</span>
                        <input
                          type="date"
                          value={draft.date}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], date: event.target.value },
                          }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                          required
                        />
                      </label>

                      <label className="text-sm text-[#363535] md:col-span-2">
                        <span className="mb-2 block font-medium">Video URL</span>
                        <input
                          type="url"
                          value={draft.video_url}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], video_url: event.target.value },
                          }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                          placeholder="https://www.tiktok.com/..."
                        />
                      </label>

                      <label className="text-sm text-[#363535]">
                        <span className="mb-2 block font-medium">Hook</span>
                        <input
                          type="text"
                          value={draft.notes.hook}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], notes: { ...current[campaign.id].notes, hook: event.target.value } },
                          }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                          placeholder="Strong first-line idea"
                        />
                      </label>

                      <label className="text-sm text-[#363535] md:col-span-2">
                        <span className="mb-2 block font-medium">Concept</span>
                        <textarea
                          value={draft.notes.concept}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], notes: { ...current[campaign.id].notes, concept: event.target.value } },
                          }))}
                          className="min-h-[88px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                          placeholder="Angle, structure, talking points"
                        />
                      </label>

                      <label className="text-sm text-[#363535] md:col-span-2">
                        <span className="mb-2 block font-medium">Context</span>
                        <textarea
                          value={draft.notes.context}
                          onChange={(event) => setFormState((current) => ({
                            ...current,
                            [campaign.id]: { ...current[campaign.id], notes: { ...current[campaign.id].notes, context: event.target.value } },
                          }))}
                          className="min-h-[88px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                          placeholder="Audience, CTA, feedback, posting context"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button type="submit" className="btn-primary" disabled={submitting === campaign.id}>
                        {submitting === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                        Save log
                      </button>
                      <button type="button" className="btn-ghost" onClick={() => setOpenDealId(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <section className="card mt-8 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="section-label mb-1">Content log</p>
            <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>All logged videos</h2>
          </div>
          <div className="text-sm text-[#6b6b6b]">{contentLog.length} entries</div>
        </div>

        {contentLog.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#e8e8e4] bg-[#fafaf9] px-6 py-12 text-center text-sm text-[#6b6b6b]">
            No videos logged yet. Use “Log content” on a campaign card to add the first post.
          </div>
        ) : (
          <div className="space-y-3">
            {contentLog.map((entry) => (
              <div key={entry.id} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#1c1c1e]">{entry.client_name}</span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${PLATFORM_COLORS[entry.platform]}`}>
                        {entry.platform}
                      </span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${LOG_STATUS_META[entry.status].chip}`}>
                        {LOG_STATUS_META[entry.status].label}
                      </span>
                      <span className="text-xs text-[#9a9a9a]">{formatDate(entry.date, true)}</span>
                    </div>
                    {entry.video_url ? (
                      <a href={entry.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#1c1c1e] hover:underline">
                        <Link2 className="h-4 w-4" />
                        <span className="max-w-[420px] truncate">{entry.video_url}</span>
                      </a>
                    ) : (
                      <p className="mt-3 text-sm text-[#9a9a9a]">No live URL yet.</p>
                    )}
                    {(entry.notes.hook || entry.notes.concept || entry.notes.context) ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Hook</p>
                          <p className="mt-2 text-sm text-[#363535]">{entry.notes.hook || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Concept</p>
                          <p className="mt-2 text-sm text-[#363535]">{entry.notes.concept || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Context</p>
                          <p className="mt-2 text-sm text-[#363535]">{entry.notes.context || '—'}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-3 lg:min-w-[170px]">
                    <div className="rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Views</p>
                      <p className="mt-1 text-lg font-semibold text-[#1c1c1e]">{formatNumber(entry.views)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Logged</p>
                      <p className="mt-1 text-sm text-[#6b6b6b]">{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
