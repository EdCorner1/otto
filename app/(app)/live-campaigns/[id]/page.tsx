'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock3,
  DollarSign,
  Eye,
  Film,
  Globe,
  Link2,
  Loader2,
  MessageSquareQuote,
  NotebookPen,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Target,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type {
  LiveCampaignApprovalStatus,
  LiveCampaignLogStatus,
  LiveCampaignPlatform,
  LiveCampaignTaskStatus,
} from '@/lib/live-campaigns'

type CampaignStatus = 'on_track' | 'behind' | 'not_started'
type ActionPriority = 'high' | 'medium' | 'low'
type ActivityType = 'campaign_started' | 'content_logged' | 'task_created' | 'task_completed' | 'notes_updated' | 'status_snapshot'

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
  internal_notes: {
    body: string
    updated_at: string | null
  }
  tasks: Array<{
    id: string
    title: string
    detail: string
    due_date: string | null
    status: LiveCampaignTaskStatus
    created_at: string
    completed_at: string | null
  }>
  task_summary: {
    open_count: number
    completed_count: number
    overdue_count: number
    completion_rate: number
    upcoming_deadlines: Array<{
      id: string
      title: string
      due_date: string | null
    }>
  }
  logs_summary: {
    drafted_count: number
    posted_count: number
    sent_for_approval_count: number
    approved_count: number
  }
  approvals_summary: {
    sent_for_approval_count: number
    approved_count: number
    revision_requested_count: number
  }
  next_actions: Array<{
    id: string
    title: string
    detail: string
    priority: ActionPriority
  }>
  activity_timeline: Array<{
    id: string
    type: ActivityType
    title: string
    detail: string
    date: string
    created_at: string
  }>
  recent_logs: Array<{
    id: string
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
  }>
  client_feedback: Array<{
    id: string
    body: string
    source: string
    date: string
    created_at: string
  }>
  approvals: Array<{
    id: string
    title: string
    status: LiveCampaignApprovalStatus
    detail: string
    date: string
    created_at: string
  }>
  placeholders: {
    next_review: string
    approvals: string
    client_feedback: string
  }
}

type TaskDraft = {
  title: string
  detail: string
  due_date: string
}

type LogEditorState = {
  status: LiveCampaignLogStatus
  video_url: string
  views: string
  date: string
  hook: string
  concept: string
  context: string
}

type FeedbackDraft = {
  body: string
  source: string
  date: string
}

type ApprovalDraft = {
  title: string
  status: LiveCampaignApprovalStatus
  detail: string
  date: string
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

const ACTION_PRIORITY_STYLES: Record<ActionPriority, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-[#e8e8e4] bg-[#fafaf9] text-[#6b6b6b]',
}

const ACTIVITY_ICON_STYLES: Record<ActivityType, { bg: string; icon: React.ReactNode }> = {
  campaign_started: { bg: 'bg-[#f1f5f9] text-[#475569]', icon: <CalendarDays className="h-4 w-4" /> },
  content_logged: { bg: 'bg-[#f5ffd9] text-[#3f6212]', icon: <Film className="h-4 w-4" /> },
  task_created: { bg: 'bg-[#eef6ff] text-[#0a66c2]', icon: <Plus className="h-4 w-4" /> },
  task_completed: { bg: 'bg-[#eefbf3] text-[#15803d]', icon: <CheckCircle2 className="h-4 w-4" /> },
  notes_updated: { bg: 'bg-[#fff7ed] text-[#c2410c]', icon: <NotebookPen className="h-4 w-4" /> },
  status_snapshot: { bg: 'bg-[#f5f5f4] text-[#57534e]', icon: <AlertCircle className="h-4 w-4" /> },
}

const LOG_STATUS_META: Record<LiveCampaignLogStatus, { label: string; chip: string }> = {
  drafted: { label: 'Drafted', chip: 'border-[#e5e7eb] bg-white text-[#57534e]' },
  posted: { label: 'Posted', chip: 'border-[#bbf7d0] bg-[#ecfdf3] text-[#166534]' },
  sent_for_approval: { label: 'Sent for approval', chip: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]' },
  approved: { label: 'Approved', chip: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' },
}

const APPROVAL_STATUS_META: Record<LiveCampaignApprovalStatus, { label: string; chip: string }> = {
  sent_for_approval: { label: 'Sent for approval', chip: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]' },
  approved: { label: 'Approved', chip: 'border-[#bbf7d0] bg-[#ecfdf3] text-[#166534]' },
  revision_requested: { label: 'Revision requested', chip: 'border-[#fdba74] bg-[#fff7ed] text-[#c2410c]' },
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

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function startOfTodayKey() {
  return new Date().toISOString().slice(0, 10)
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

function InfoStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const tones = {
    default: 'border-[#ecece8] bg-[#fafaf9] text-[#1c1c1e]',
    success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]',
    warning: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
    danger: 'border-[#fecaca] bg-[#fff1f1] text-[#a61b1b]',
  } as const

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}

export default function LiveCampaignDetailPage() {
  const params = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<LiveCampaignDetailPayload | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [logBusyId, setLogBusyId] = useState<string | null>(null)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [feedbackBusyId, setFeedbackBusyId] = useState<string | null>(null)
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [approvalSubmitting, setApprovalSubmitting] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({ title: '', detail: '', due_date: '' })
  const [editingTaskDraft, setEditingTaskDraft] = useState<TaskDraft>({ title: '', detail: '', due_date: '' })
  const [logDrafts, setLogDrafts] = useState<Record<string, LogEditorState>>({})
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft>({ body: '', source: '', date: startOfTodayKey() })
  const [approvalDraft, setApprovalDraft] = useState<ApprovalDraft>({ title: '', status: 'sent_for_approval', detail: '', date: startOfTodayKey() })

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
      const nextPayload = data as LiveCampaignDetailPayload
      setPayload(nextPayload)
      setNotesDraft(nextPayload.internal_notes.body || '')
      setLogDrafts(Object.fromEntries(nextPayload.recent_logs.map((log) => [log.id, {
        status: log.status,
        video_url: log.video_url,
        views: String(log.views ?? 0),
        date: log.date,
        hook: log.notes.hook || '',
        concept: log.notes.concept || '',
        context: log.notes.context || '',
      }])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load campaign.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) loadCampaign()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, supabase])

  const updateCampaign = async (body: object) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) throw new Error('Please log in again.')

    const response = await fetch(`/api/ed/live-campaigns/${params.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Could not update campaign.')
  }

  const handleNotesSave = async () => {
    try {
      setSavingNotes(true)
      setError('')
      await updateCampaign({ internal_notes: notesDraft })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save notes.')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!taskDraft.title.trim()) return

    try {
      setTaskSubmitting(true)
      setError('')
      await updateCampaign({
        task: {
          action: 'create',
          title: taskDraft.title,
          detail: taskDraft.detail,
          due_date: taskDraft.due_date || null,
        },
      })
      setTaskDraft({ title: '', detail: '', due_date: '' })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add task.')
    } finally {
      setTaskSubmitting(false)
    }
  }

  const handleTaskAction = async (taskId: string, action: 'toggle' | 'delete') => {
    try {
      setTaskBusyId(taskId)
      setError('')
      await updateCampaign({ task: { action, id: taskId } })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update task.')
    } finally {
      setTaskBusyId(null)
    }
  }

  const startEditingTask = (task: LiveCampaignDetailPayload['tasks'][number]) => {
    setEditingTaskId(task.id)
    setEditingTaskDraft({
      title: task.title,
      detail: task.detail,
      due_date: task.due_date || '',
    })
  }

  const saveTaskEdit = async (taskId: string) => {
    if (!editingTaskDraft.title.trim()) return
    try {
      setTaskBusyId(taskId)
      setError('')
      await updateCampaign({
        task: {
          action: 'update',
          id: taskId,
          title: editingTaskDraft.title,
          detail: editingTaskDraft.detail,
          due_date: editingTaskDraft.due_date,
        },
      })
      setEditingTaskId(null)
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save task changes.')
    } finally {
      setTaskBusyId(null)
    }
  }

  const saveLogEdit = async (logId: string) => {
    const draft = logDrafts[logId]
    if (!draft) return
    try {
      setLogBusyId(logId)
      setError('')
      await updateCampaign({
        log: {
          action: 'update',
          id: logId,
          status: draft.status,
          video_url: draft.video_url,
          views: Number(draft.views || 0),
          date: draft.date,
          notes: {
            hook: draft.hook,
            concept: draft.concept,
            context: draft.context,
          },
        },
      })
      setEditingLogId(null)
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save log changes.')
    } finally {
      setLogBusyId(null)
    }
  }

  const deleteLog = async (logId: string) => {
    try {
      setLogBusyId(logId)
      setError('')
      await updateCampaign({ log: { action: 'delete', id: logId } })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove log.')
    } finally {
      setLogBusyId(null)
    }
  }

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!feedbackDraft.body.trim()) return

    try {
      setFeedbackSubmitting(true)
      setError('')
      await updateCampaign({
        feedback: {
          action: 'create',
          body: feedbackDraft.body,
          source: feedbackDraft.source,
          date: feedbackDraft.date,
        },
      })
      setFeedbackDraft({ body: '', source: '', date: startOfTodayKey() })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add feedback.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const deleteFeedback = async (feedbackId: string) => {
    try {
      setFeedbackBusyId(feedbackId)
      setError('')
      await updateCampaign({ feedback: { action: 'delete', id: feedbackId } })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove feedback.')
    } finally {
      setFeedbackBusyId(null)
    }
  }

  const submitApproval = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!approvalDraft.title.trim()) return

    try {
      setApprovalSubmitting(true)
      setError('')
      await updateCampaign({
        approval: {
          action: 'create',
          title: approvalDraft.title,
          status: approvalDraft.status,
          detail: approvalDraft.detail,
          date: approvalDraft.date,
        },
      })
      setApprovalDraft({ title: '', status: 'sent_for_approval', detail: '', date: startOfTodayKey() })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add approval item.')
    } finally {
      setApprovalSubmitting(false)
    }
  }

  const deleteApproval = async (approvalId: string) => {
    try {
      setApprovalBusyId(approvalId)
      setError('')
      await updateCampaign({ approval: { action: 'delete', id: approvalId } })
      await loadCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove approval item.')
    } finally {
      setApprovalBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ccff00] border-t-transparent" />
      </div>
    )
  }

  if (error && !payload) {
    return (
      <div className="mx-auto max-w-5xl px-2 pb-10 md:px-4">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error || 'Campaign not found.'}
        </div>
      </div>
    )
  }

  if (!payload) return null

  const {
    campaign,
    summary,
    goals,
    views_by_platform,
    notes,
    internal_notes,
    tasks,
    task_summary,
    logs_summary,
    approvals_summary,
    next_actions,
    activity_timeline,
    recent_logs,
    client_feedback,
    approvals,
    placeholders,
  } = payload
  const status = STATUS_STYLES[campaign.campaign_status]

  return (
    <div className="mx-auto max-w-7xl px-2 pb-12 md:px-4">
      <div className="mb-6">
        <Link href="/live-campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-[#363535] hover:text-[#1c1c1e]">
          <ArrowLeft className="h-4 w-4" />
          Back to live campaigns
        </Link>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

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
        <MetricCard label="Progress to date" value={`${summary.progress_percent}%`} hint={`${summary.videos_this_month}/${summary.monthly_target_to_date || campaign.daily_target} posted/approved pieces against target`} icon={<Target className="h-5 w-5" />} />
        <MetricCard label="Views this month" value={formatNumber(summary.views_this_month)} hint={`${formatNumber(summary.total_views)} lifetime views on posted/approved content`} icon={<Eye className="h-5 w-5" />} />
        <MetricCard label="Videos posted" value={formatNumber(summary.total_videos)} hint={`${formatNumber(summary.videos_this_week)} this week · ${formatNumber(summary.videos_today)} today`} icon={<Film className="h-5 w-5" />} />
        <MetricCard label="Earned so far" value={formatCurrency(summary.earned_prorated)} hint={`${formatCurrency(campaign.monthly_rate)} monthly retainer`} icon={<DollarSign className="h-5 w-5" />} />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="card shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="section-label mb-1">Next actions</p>
                <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>What needs your attention</h2>
              </div>
              <div className="text-sm text-[#6b6b6b]">{task_summary.open_count} open tasks</div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {next_actions.map((action) => (
                <div key={action.id} className={`rounded-[24px] border p-4 ${ACTION_PRIORITY_STYLES[action.priority]}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">{action.priority} priority</p>
                  <p className="mt-2 text-base font-semibold">{action.title}</p>
                  <p className="mt-2 text-sm opacity-90">{action.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="section-label mb-1">Tasks</p>
                <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Client work checklist</h2>
              </div>
              <div className="text-sm text-[#6b6b6b]">{task_summary.completion_rate}% complete</div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <InfoStat label="Open" value={String(task_summary.open_count)} />
              <InfoStat label="Completed" value={String(task_summary.completed_count)} tone="success" />
              <InfoStat label="Overdue" value={String(task_summary.overdue_count)} tone={task_summary.overdue_count > 0 ? 'danger' : 'default'} />
              <InfoStat label="Due next" value={task_summary.upcoming_deadlines[0]?.due_date ? formatDate(task_summary.upcoming_deadlines[0].due_date) : 'No deadline'} tone="warning" />
            </div>

            <form onSubmit={handleTaskSubmit} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-[#363535] md:col-span-2">
                  <span className="mb-2 block font-medium">Task title</span>
                  <input
                    type="text"
                    value={taskDraft.title}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                    placeholder="Send 3 fresh hook options for next round"
                    required
                  />
                </label>

                <label className="text-sm text-[#363535] md:col-span-2">
                  <span className="mb-2 block font-medium">Details</span>
                  <textarea
                    value={taskDraft.detail}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, detail: event.target.value }))}
                    className="min-h-[104px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                    placeholder="What actually needs doing, context, or follow-up notes"
                  />
                </label>

                <label className="text-sm text-[#363535] md:max-w-[240px]">
                  <span className="mb-2 block font-medium">Due date</span>
                  <input
                    type="date"
                    value={taskDraft.due_date}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, due_date: event.target.value }))}
                    className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="submit" className="btn-primary" disabled={taskSubmitting}>
                  {taskSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add task
                </button>
              </div>
            </form>

            <div className="mt-5 space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#e8e8e4] bg-[#fafaf9] px-6 py-10 text-sm text-[#6b6b6b]">
                  No tasks yet. Add the next concrete piece of client work so the campaign has an active checklist.
                </div>
              ) : tasks.map((task) => {
                const isDone = task.status === 'done'
                const isBusy = taskBusyId === task.id
                const isEditing = editingTaskId === task.id
                return (
                  <div key={task.id} className={`rounded-[24px] border p-4 ${isDone ? 'border-[#d6f5df] bg-[#f5fcf7]' : 'border-[#ecece8] bg-[#fafaf9]'}`}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingTaskDraft.title}
                          onChange={(event) => setEditingTaskDraft((current) => ({ ...current, title: event.target.value }))}
                          className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                        />
                        <textarea
                          value={editingTaskDraft.detail}
                          onChange={(event) => setEditingTaskDraft((current) => ({ ...current, detail: event.target.value }))}
                          className="min-h-[96px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                        />
                        <input
                          type="date"
                          value={editingTaskDraft.due_date}
                          onChange={(event) => setEditingTaskDraft((current) => ({ ...current, due_date: event.target.value }))}
                          className="w-full max-w-[220px] rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" className="btn-primary" onClick={() => saveTaskEdit(task.id)} disabled={isBusy}>
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save changes
                          </button>
                          <button type="button" className="btn-ghost" onClick={() => setEditingTaskId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${isDone ? 'border-[#bbf7d0] bg-[#ecfdf3] text-[#166534]' : 'border-[#e8e8e4] bg-white text-[#57534e]'}`}>
                              <CircleDot className={`h-3 w-3 ${isDone ? 'fill-[#22c55e] text-[#22c55e]' : 'fill-[#d6d3d1] text-[#d6d3d1]'}`} />
                              {isDone ? 'Done' : 'To do'}
                            </span>
                            {task.due_date ? (
                              <span className="inline-flex items-center gap-1 text-xs text-[#6b6b6b]"><Clock3 className="h-3.5 w-3.5" /> Due {formatDate(task.due_date, true)}</span>
                            ) : null}
                          </div>
                          <p className={`mt-3 text-base font-semibold ${isDone ? 'text-[#3f3f46] line-through' : 'text-[#1c1c1e]'}`}>{task.title}</p>
                          {task.detail ? <p className="mt-2 text-sm text-[#6b6b6b]">{task.detail}</p> : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" className="btn-ghost border border-[#e8e8e4] bg-white px-3 py-2 text-sm" onClick={() => startEditingTask(task)} disabled={isBusy}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button type="button" className="btn-ghost border border-[#e8e8e4] bg-white px-3 py-2 text-sm" onClick={() => handleTaskAction(task.id, 'toggle')} disabled={isBusy}>
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {isDone ? 'Mark open' : 'Mark done'}
                          </button>
                          <button type="button" className="btn-ghost border border-[#f1d6d6] bg-white px-3 py-2 text-sm text-[#a61b1b]" onClick={() => handleTaskAction(task.id, 'delete')} disabled={isBusy}>
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="section-label mb-1">Content log workflow</p>
                <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Drafts, posts, approvals</h2>
              </div>
              <div className="text-sm text-[#6b6b6b]">{recent_logs.length} recent entries</div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <InfoStat label="Drafted" value={String(logs_summary.drafted_count)} />
              <InfoStat label="Posted" value={String(logs_summary.posted_count)} tone="success" />
              <InfoStat label="Awaiting approval" value={String(logs_summary.sent_for_approval_count)} tone="warning" />
              <InfoStat label="Approved" value={String(logs_summary.approved_count)} tone="default" />
            </div>

            {recent_logs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#e8e8e4] bg-[#fafaf9] px-6 py-10 text-sm text-[#6b6b6b]">
                No posts logged yet. Use the content logger to start tracking delivery.
              </div>
            ) : (
              <div className="space-y-3">
                {recent_logs.map((log) => {
                  const isEditing = editingLogId === log.id
                  const isBusy = logBusyId === log.id
                  const draft = logDrafts[log.id]
                  return (
                    <div key={log.id} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${PLATFORM_COLORS[log.platform]}`}>{log.platform}</span>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${LOG_STATUS_META[(isEditing ? draft?.status : log.status) || log.status].chip}`}>
                              {LOG_STATUS_META[(isEditing ? draft?.status : log.status) || log.status].label}
                            </span>
                            <span className="text-xs text-[#9a9a9a]">{formatDate(log.date, true)}</span>
                          </div>

                          {isEditing && draft ? (
                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="text-sm text-[#363535]">
                                <span className="mb-2 block font-medium">Status</span>
                                <select
                                  value={draft.status}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], status: event.target.value as LiveCampaignLogStatus } }))}
                                  className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                >
                                  <option value="drafted">Drafted</option>
                                  <option value="posted">Posted</option>
                                  <option value="sent_for_approval">Sent for approval</option>
                                  <option value="approved">Approved</option>
                                </select>
                              </label>
                              <label className="text-sm text-[#363535]">
                                <span className="mb-2 block font-medium">Date</span>
                                <input
                                  type="date"
                                  value={draft.date}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], date: event.target.value } }))}
                                  className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                />
                              </label>
                              <label className="text-sm text-[#363535] md:col-span-2">
                                <span className="mb-2 block font-medium">Video URL</span>
                                <input
                                  type="url"
                                  value={draft.video_url}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], video_url: event.target.value } }))}
                                  className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                  placeholder="https://..."
                                />
                              </label>
                              <label className="text-sm text-[#363535]">
                                <span className="mb-2 block font-medium">Views</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={draft.views}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], views: event.target.value } }))}
                                  className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                />
                              </label>
                              <label className="text-sm text-[#363535]">
                                <span className="mb-2 block font-medium">Hook</span>
                                <input
                                  type="text"
                                  value={draft.hook}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], hook: event.target.value } }))}
                                  className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                  placeholder="Problem-first hook..."
                                />
                              </label>
                              <label className="text-sm text-[#363535] md:col-span-2">
                                <span className="mb-2 block font-medium">Concept</span>
                                <textarea
                                  value={draft.concept}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], concept: event.target.value } }))}
                                  className="min-h-[88px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                  placeholder="Core angle or structure"
                                />
                              </label>
                              <label className="text-sm text-[#363535] md:col-span-2">
                                <span className="mb-2 block font-medium">Context</span>
                                <textarea
                                  value={draft.context}
                                  onChange={(event) => setLogDrafts((current) => ({ ...current, [log.id]: { ...current[log.id], context: event.target.value } }))}
                                  className="min-h-[88px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                                  placeholder="Usage context, CTA, audience, feedback to remember"
                                />
                              </label>
                            </div>
                          ) : (
                            <>
                              {log.video_url ? (
                                <a href={log.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#1c1c1e] hover:underline">
                                  <Link2 className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{log.video_url}</span>
                                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                                </a>
                              ) : (
                                <p className="mt-3 text-sm text-[#9a9a9a]">No live URL added yet.</p>
                              )}
                              {(log.notes.hook || log.notes.concept || log.notes.context) ? (
                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                  <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Hook</p>
                                    <p className="mt-2 text-sm text-[#363535]">{log.notes.hook || '—'}</p>
                                  </div>
                                  <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Concept</p>
                                    <p className="mt-2 text-sm text-[#363535]">{log.notes.concept || '—'}</p>
                                  </div>
                                  <div className="rounded-2xl border border-[#ecece8] bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Context</p>
                                    <p className="mt-2 text-sm text-[#363535]">{log.notes.context || '—'}</p>
                                  </div>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col sm:items-stretch sm:min-w-[190px]">
                          <div className="rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Views</p>
                            <p className="mt-1 text-lg font-semibold text-[#1c1c1e]">{formatNumber(Number((isEditing ? draft?.views : String(log.views)) || 0))}</p>
                          </div>
                          <div className="rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.14em] text-[#9a9a9a]">Logged</p>
                            <p className="mt-1 text-sm font-semibold text-[#1c1c1e]">{formatDateTime(log.created_at)}</p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-start">
                            {isEditing ? (
                              <>
                                <button type="button" className="btn-primary" onClick={() => saveLogEdit(log.id)} disabled={isBusy}>
                                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                  Save
                                </button>
                                <button type="button" className="btn-ghost" onClick={() => setEditingLogId(null)}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="btn-ghost border border-[#e8e8e4] bg-white px-3 py-2 text-sm" onClick={() => setEditingLogId(log.id)}>
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </button>
                                <button type="button" className="btn-ghost border border-[#f1d6d6] bg-white px-3 py-2 text-sm text-[#a61b1b]" onClick={() => deleteLog(log.id)} disabled={isBusy}>
                                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="section-label mb-1">Client feedback</p>
                  <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>What the client said</h2>
                </div>
                <div className="text-sm text-[#6b6b6b]">{client_feedback.length} notes</div>
              </div>

              <form onSubmit={submitFeedback} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-sm text-[#363535]">
                    <span className="mb-2 block font-medium">Feedback</span>
                    <textarea
                      value={feedbackDraft.body}
                      onChange={(event) => setFeedbackDraft((current) => ({ ...current, body: event.target.value }))}
                      className="min-h-[110px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                      placeholder="Client liked the hook but wants a clearer product payoff in the first 5 seconds..."
                      required
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-sm text-[#363535]">
                      <span className="mb-2 block font-medium">Source</span>
                      <input
                        type="text"
                        value={feedbackDraft.source}
                        onChange={(event) => setFeedbackDraft((current) => ({ ...current, source: event.target.value }))}
                        className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                        placeholder="WhatsApp / call / email"
                      />
                    </label>
                    <label className="text-sm text-[#363535]">
                      <span className="mb-2 block font-medium">Date</span>
                      <input
                        type="date"
                        value={feedbackDraft.date}
                        onChange={(event) => setFeedbackDraft((current) => ({ ...current, date: event.target.value }))}
                        className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn-primary" disabled={feedbackSubmitting}>
                    {feedbackSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add feedback
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                {client_feedback.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#e8e8e4] bg-[#fafaf9] px-6 py-10 text-sm text-[#6b6b6b]">
                    No client feedback logged yet.
                  </div>
                ) : client_feedback.map((entry) => (
                  <div key={entry.id} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#9a9a9a]">
                          <span>{formatDate(entry.date, true)}</span>
                          {entry.source ? <><span>•</span><span>{entry.source}</span></> : null}
                        </div>
                        <p className="mt-3 text-sm text-[#363535]">{entry.body}</p>
                      </div>
                      <button type="button" className="btn-ghost border border-[#f1d6d6] bg-white px-3 py-2 text-sm text-[#a61b1b]" onClick={() => deleteFeedback(entry.id)} disabled={feedbackBusyId === entry.id}>
                        {feedbackBusyId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="section-label mb-1">Approvals & revisions</p>
                  <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Approval tracker</h2>
                </div>
                <div className="text-sm text-[#6b6b6b]">{approvals.length} items</div>
              </div>

              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InfoStat label="Awaiting" value={String(approvals_summary.sent_for_approval_count)} tone="warning" />
                <InfoStat label="Approved" value={String(approvals_summary.approved_count)} tone="success" />
                <InfoStat label="Revisions" value={String(approvals_summary.revision_requested_count)} tone={approvals_summary.revision_requested_count > 0 ? 'danger' : 'default'} />
              </div>

              <form onSubmit={submitApproval} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm text-[#363535] md:col-span-2">
                    <span className="mb-2 block font-medium">Title</span>
                    <input
                      type="text"
                      value={approvalDraft.title}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                      placeholder="UGC v3 sent to client"
                      required
                    />
                  </label>
                  <label className="text-sm text-[#363535]">
                    <span className="mb-2 block font-medium">Status</span>
                    <select
                      value={approvalDraft.status}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, status: event.target.value as LiveCampaignApprovalStatus }))}
                      className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                    >
                      <option value="sent_for_approval">Sent for approval</option>
                      <option value="approved">Approved</option>
                      <option value="revision_requested">Revision requested</option>
                    </select>
                  </label>
                  <label className="text-sm text-[#363535]">
                    <span className="mb-2 block font-medium">Date</span>
                    <input
                      type="date"
                      value={approvalDraft.date}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, date: event.target.value }))}
                      className="w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                    />
                  </label>
                  <label className="text-sm text-[#363535] md:col-span-2">
                    <span className="mb-2 block font-medium">Details</span>
                    <textarea
                      value={approvalDraft.detail}
                      onChange={(event) => setApprovalDraft((current) => ({ ...current, detail: event.target.value }))}
                      className="min-h-[90px] w-full rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm outline-none focus:border-[#ccff00]"
                      placeholder="Requested stronger CTA, new first frame, and cleaner subtitles..."
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn-primary" disabled={approvalSubmitting}>
                    {approvalSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add approval item
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                {approvals.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#e8e8e4] bg-[#fafaf9] px-6 py-10 text-sm text-[#6b6b6b]">
                    No approval events tracked yet.
                  </div>
                ) : approvals.map((entry) => (
                  <div key={entry.id} className="rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_STATUS_META[entry.status].chip}`}>
                            {APPROVAL_STATUS_META[entry.status].label}
                          </span>
                          <span className="text-xs text-[#9a9a9a]">{formatDate(entry.date, true)}</span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#1c1c1e]">{entry.title}</p>
                        {entry.detail ? <p className="mt-2 text-sm text-[#6b6b6b]">{entry.detail}</p> : null}
                      </div>
                      <button type="button" className="btn-ghost border border-[#f1d6d6] bg-white px-3 py-2 text-sm text-[#a61b1b]" onClick={() => deleteApproval(entry.id)} disabled={approvalBusyId === entry.id}>
                        {approvalBusyId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                <p className="section-label mb-1">Activity timeline</p>
                <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Everything that moved this campaign</h2>
              </div>
              <div className="text-sm text-[#6b6b6b]">{activity_timeline.length} events</div>
            </div>

            <div className="space-y-4">
              {activity_timeline.map((item) => {
                const iconStyle = ACTIVITY_ICON_STYLES[item.type]
                return (
                  <div key={item.id} className="flex gap-3 rounded-[24px] border border-[#ecece8] bg-[#fafaf9] p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconStyle.bg}`}>
                      {iconStyle.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-[#1c1c1e]">{item.title}</p>
                        <p className="text-xs text-[#9a9a9a]">{formatDate(item.date, true)}</p>
                      </div>
                      <p className="mt-1 text-sm text-[#6b6b6b]">{item.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
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
            <p className="section-label mb-1">Internal notes</p>
            <h2 className="text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Client context for yourself</h2>
            <p className="mt-3 text-sm text-[#6b6b6b]">Keep quick notes on feedback, blockers, angles that worked, revisions, and anything you need to remember next time.</p>

            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              className="mt-5 min-h-[220px] w-full rounded-[24px] border border-[#e8e8e4] bg-[#fafaf9] px-4 py-4 text-sm text-[#1c1c1e] outline-none focus:border-[#ccff00]"
              placeholder="Example: Client liked the quick app demo angle, wants stronger hook in first 2 seconds, avoid mentioning pricing until the CTA frame..."
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#9a9a9a]">Last updated: {formatDateTime(internal_notes.updated_at)}</p>
              <button type="button" className="btn-primary" onClick={handleNotesSave} disabled={savingNotes}>
                {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                Save notes
              </button>
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
                <RotateCcw className="mt-0.5 h-4 w-4 text-[#6b6b6b]" />
                <div>
                  <p className="font-semibold text-[#1c1c1e]">Approvals & revisions</p>
                  <p className="mt-1 text-[#6b6b6b]">{placeholders.approvals}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4">
                <MessageSquareQuote className="mt-0.5 h-4 w-4 text-[#6b6b6b]" />
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
