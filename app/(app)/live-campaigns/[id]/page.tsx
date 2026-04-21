'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  DollarSign,
  Eye,
  Film,
  Globe,
  Link2,
  NotebookPen,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { LiveCampaignPlatform } from '@/lib/live-campaigns'

type CampaignStatus = 'on_track' | 'behind' | 'not_started'

type LiveCampaignDetailPayload = {
  campaign: {
    id: string
    title: string
    client_name: string
    avatar_url: string | null
    website: string | null
    industry: string | null
    amount: number
    status: string
    campaign_status: CampaignStatus
    start_date: string
    contract_days: number
    days_active: number
    daily_target: number
    monthly_rate: number
    platforms: LiveCampaignPlatform[]
    description: string | null
    deliverables: string | null
    created_at: string
    updated_at: string
  }
  summary: {
    progress_percent: number
    monthly_target_to_date: number
    videos_today: number
    videos_this_week: number
    videos_this_month: number
    views_this_month: number
    total_videos: number
    total_views: number
    earned_prorated: number
    latest_post_date: string | null
    latest_post_platform: LiveCampaignPlatform | null
  }
  goals: Array<{
    platform: LiveCampaignPlatform
    target_per_day: number
    target_to_date: number
    posts_this_month: number
    total_posts: number
    progress_percent: number
    status: CampaignStatus
  }>
  views_by_platform: Array<{
    platform: LiveCampaignPlatform
    views: number
  }>
  notes: string[]
  recent_logs: Array<{
    id: string
    platform: LiveCampaignPlatform
    video_url: string
    views: number
    date: string
    created_at: string
  }>
  placeholders: {
    next_review: string
    approvals: string
    client_feedback: string
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

function formatDate(value: string | null, withYear = false) {
  if (!value) return '—'
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

function MetricCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[#ecece8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{value}</p>
          {hint ? <p className="mt-2 text-sm text-[#6b6b6b]">{hint}</p> : null}
        </div>
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7fbe7] text-[#1c1c1e]">{icon}</div> : null}
      </div>
    </div>
  )
}

export default function LiveCampaignDetailPage() {
  const params = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<LiveCampaignDetailPayload | null>(null)

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setError('')
        setLoading(true)

        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) throw new Error('Please log in again.')

        const response = await fetch(`/api/ed/live-campaigns/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load campaign.')
        setPayload(data as LiveCampaignDetailPayload)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load campaign.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) loadCampaign()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ccff00] border-t-transparent" />
      </div>
    )
  }

  if (error || !payload) {
    return (
      <div className="mx-auto max-w-5xl px-2 pb-10 md:px-4">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error || 'Campaign not found.'}
        </div>
      </div>
    )
  }

  const { campaign, summary, goals, views_by_platform, notes, recent_logs, placeholders } = payload
  const status = STATUS_STYLES[campaign.campaign_status]

  return (
    <div className="mx-auto max-w-7xl px-2 pb-12 md:px-4">
      <div className="mb-6">
        <Link href="/live-campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-[#363535] hover:text-[#1c1c1e]">
          <ArrowLeft className="h-4 w-4" />
          Back to live campaigns
        </Link>
      </div>

      <section className="card shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {campaign.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.avatar_url} alt={campaign.client_name} className="h-16 w-16 rounded-3xl border border-[#ecece8] object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#1c1c1e] text-xl font-semibold text-white">
                {campaign.client_name.slice(0, 1)}
              </div>
            )}

            <div>
              <p className="section-label mb-2">Campaign overview</p>
              <h1 className="text-[clamp(32px,5vw,52px)] leading-none text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-2px' }}>
                {campaign.client_name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#6b6b6b]">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Started {formatDate(campaign.start_date, true)}</span>
                <span>•</span>
                <span>{campaign.days_active} days active</span>
                {campaign.industry ? <><span>•</span><span>{campaign.industry}</span></> : null}
              </div>
              {campaign.description ? <p className="mt-4 max-w-3xl text-sm text-[#6b6b6b]">{campaign.description}</p> : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${status.chip}`}>
              <CircleDot className={`h-3.5 w-3.5 ${status.dotClass}`} />
              <span>{status.label}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {campaign.platforms.map((platform) => (
                <span key={platform} className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${PLATFORM_COLORS[platform]}`}>
                  {platform}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/live-campaigns?log=${campaign.id}`} className="btn-primary">
                <ClipboardList className="h-4 w-4" />
                Log content
              </Link>
              {campaign.website ? (
                <a href={campaign.website} target="_blank" rel="noreferrer" className="btn-ghost border border-[#e8e8e4] bg-white px-4 py-3">
                  <Globe className="h-4 w-4" />
                  Visit website
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Progress to date" value={`${summary.progress_percent}%`} hint={`${summary.videos_this_month}/${summary.monthly_target_to_date || campaign.daily_target} posts against target`} icon={<Target className="h-5 w-5" />} />
        <MetricCard label="Views this month" value={formatNumber(summary.views_this_month)} hint={`${formatNumber(summary.total_views)} lifetime views logged`} icon={<Eye className="h-5 w-5" />} />
        <MetricCard label="Videos posted" value={formatNumber(summary.total_videos)} hint={`${formatNumber(summary.videos_this_week)} this week · ${formatNumber(summary.videos_today)} today`} icon={<Film className="h-5 w-5" />} />
        <MetricCard label="Earned so far" value={formatCurrency(summary.earned_prorated)} hint={`${formatCurrency(campaign.monthly_rate)} monthly retainer`} icon={<DollarSign className="h-5 w-5" />} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="card shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="section-label mb-1">Goals & targets</p>
                <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>What this campaign needs</h2>
              </div>
              <div className="text-sm text-[#6b6b6b]">{campaign.daily_target} posts/day total</div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {goals.map((goal) => {
                const goalStatus = STATUS_STYLES[goal.status]
                return (
                  <div key={goal.platform} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${PLATFORM_COLORS[goal.platform]}`}>{goal.platform}</span>
                        <p className="mt-3 text-sm font-semibold text-[#1c1c1e]">{goal.posts_this_month} of {goal.target_to_date} posts logged this month</p>
                        <p className="mt-1 text-sm text-[#6b6b6b]">Target pace: about {goal.target_per_day}/day · {goal.total_posts} lifetime posts</p>
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${goalStatus.chip}`}>
                        <CircleDot className={`h-3 w-3 ${goalStatus.dotClass}`} />
                        {goalStatus.label}
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ecece8]">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, goal.progress_percent)}%`, backgroundColor: goalStatus.bar }} />
                    </div>
                    <p className="mt-2 text-xs text-[#6b6b6b]">{goal.progress_percent}% to month-to-date target</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="section-label mb-1">Recent content log</p>
                <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Latest posted content</h2>
              </div>
              <div className="text-sm text-[#6b6b6b]">{recent_logs.length} most recent entries</div>
            </div>

            {recent_logs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#e8e8e4] bg-[#fafaf9] px-6 py-10 text-sm text-[#6b6b6b]">
                No posts logged yet. Use the content logger to start tracking delivery.
              </div>
            ) : (
              <div className="space-y-3">
                {recent_logs.map((log) => (
                  <div key={log.id} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${PLATFORM_COLORS[log.platform]}`}>{log.platform}</span>
                          <span className="text-xs text-[#9a9a9a]">{formatDate(log.date, true)}</span>
                        </div>
                        <a href={log.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#1c1c1e] hover:underline">
                          <Link2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">{log.video_url}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0" />
                        </a>
                      </div>
                      <div className="rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Views</p>
                        <p className="mt-1 text-lg font-semibold text-[#1c1c1e]">{formatNumber(log.views)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card shadow-sm">
            <p className="section-label mb-1">Progress summary</p>
            <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Manager snapshot</h2>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-[#6b6b6b]">
                  <span>Month-to-date pacing</span>
                  <span>{summary.progress_percent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#f1f1ec]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${summary.progress_percent}%`, backgroundColor: status.bar }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Latest post</p>
                  <p className="mt-2 text-sm font-semibold text-[#1c1c1e]">{formatDate(summary.latest_post_date, true)}</p>
                  <p className="mt-1 text-xs text-[#6b6b6b]">{summary.latest_post_platform || 'No platform yet'}</p>
                </div>
                <div className="rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Contract length</p>
                  <p className="mt-2 text-sm font-semibold text-[#1c1c1e]">{campaign.contract_days} days</p>
                  <p className="mt-1 text-xs text-[#6b6b6b]">Started {formatDate(campaign.start_date)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <p className="section-label mb-1">Views by platform</p>
            <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Where results are coming from</h2>
            <div className="mt-5 space-y-3">
              {views_by_platform.map((row) => (
                <div key={row.platform} className="rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${PLATFORM_COLORS[row.platform]}`}>{row.platform}</span>
                    <span className="text-sm font-semibold text-[#1c1c1e]">{formatNumber(row.views)} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card shadow-sm">
            <p className="section-label mb-1">Notes</p>
            <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>What to keep in mind</h2>
            <div className="mt-5 space-y-3">
              {notes.map((note, index) => (
                <div key={`${note}-${index}`} className="flex items-start gap-3 rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                  <NotebookPen className="mt-0.5 h-4 w-4 text-[#6b6b6b]" />
                  <p className="text-sm text-[#363535]">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card shadow-sm">
            <p className="section-label mb-1">Current placeholders</p>
            <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Still manual in MVP</h2>
            <div className="mt-5 space-y-3 text-sm text-[#363535]">
              <div className="flex items-start gap-3 rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#6b6b6b]" />
                <div>
                  <p className="font-semibold text-[#1c1c1e]">Review cadence</p>
                  <p className="mt-1 text-[#6b6b6b]">{placeholders.next_review}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#6b6b6b]" />
                <div>
                  <p className="font-semibold text-[#1c1c1e]">Approvals & revisions</p>
                  <p className="mt-1 text-[#6b6b6b]">{placeholders.approvals}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#6b6b6b]" />
                <div>
                  <p className="font-semibold text-[#1c1c1e]">Client feedback</p>
                  <p className="mt-1 text-[#6b6b6b]">{placeholders.client_feedback}</p>
                </div>
              </div>
            </div>
          </div>

          {campaign.deliverables ? (
            <div className="card shadow-sm">
              <p className="section-label mb-1">Deliverables</p>
              <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Original campaign brief</h2>
              <p className="mt-4 text-sm text-[#6b6b6b]">{campaign.deliverables}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
