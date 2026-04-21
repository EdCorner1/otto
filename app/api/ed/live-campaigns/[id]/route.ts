import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeLiveCampaignStats,
  dateKey,
  normalizeApprovalStatus,
  normalizeLogStatus,
  parseLiveCampaignMetadata,
  serializeLiveCampaignMetadata,
  sortApprovalsDesc,
  sortFeedbackDesc,
  sortLogsDesc,
  sortTasks,
} from '@/lib/live-campaigns'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'

type RouteContext = { params: Promise<{ id: string }> }

type DealRow = {
  id: string
  creator_id: string
  brand_id: string
  job_id: string
  amount: number | string | null
  status: string | null
  created_at: string
  updated_at: string
  submitted_notes: string | null
  brands:
    | { company_name?: string | null; logo_url?: string | null; website?: string | null; industry?: string | null }
    | Array<{ company_name?: string | null; logo_url?: string | null; website?: string | null; industry?: string | null }>
    | null
  jobs: { title?: string | null; description?: string | null; deliverables?: string | null } | Array<{ title?: string | null; description?: string | null; deliverables?: string | null }> | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

async function getAuthContext(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return { error: 'Missing auth token.', status: 401 as const }

  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) {
    return { error: 'Not authenticated.', status: 401 as const }
  }

  const user = authData.user
  const [{ data: creatorRow }, { data: brandRow }, { data: userRow }] = await Promise.all([
    admin.from('creators').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('brands').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])

  let role = (user.user_metadata?.role as Role | undefined) || (userRow?.role as Role | undefined) || null
  if (!role) {
    if (creatorRow?.id && !brandRow?.id) role = 'creator'
    else if (brandRow?.id && !creatorRow?.id) role = 'brand'
    else role = 'creator'
  }

  return {
    admin,
    role,
    creatorId: creatorRow?.id || null,
    brandId: brandRow?.id || null,
  }
}

function summarizeGoals(metadata: NonNullable<ReturnType<typeof parseLiveCampaignMetadata>>, stats: ReturnType<typeof computeLiveCampaignStats>) {
  const countedLogs = metadata.logs.filter((log) => log.status === 'posted' || log.status === 'approved')
  const targetPerPlatform = metadata.platforms.length > 0
    ? Math.max(1, Math.round(metadata.daily_target / metadata.platforms.length))
    : metadata.daily_target

  return metadata.platforms.map((platform) => {
    const totalPosts = countedLogs.filter((log) => log.platform === platform).length
    const monthPosts = countedLogs.filter((log) => {
      if (log.platform !== platform) return false
      const logDate = new Date(`${log.date}T12:00:00Z`)
      const now = new Date()
      return logDate.getUTCFullYear() === now.getUTCFullYear() && logDate.getUTCMonth() === now.getUTCMonth()
    }).length
    const targetToDate = Math.max(0, Math.round(stats.monthlyTargetToDate / Math.max(1, metadata.platforms.length)))
    const progressPercent = targetToDate > 0 ? Math.min(100, Math.round((monthPosts / targetToDate) * 100)) : 0

    return {
      platform,
      target_per_day: targetPerPlatform,
      target_to_date: targetToDate,
      posts_this_month: monthPosts,
      total_posts: totalPosts,
      progress_percent: progressPercent,
      status: monthPosts === 0 ? 'not_started' : monthPosts >= targetToDate ? 'on_track' : 'behind',
    }
  })
}

function buildNextActions(metadata: NonNullable<ReturnType<typeof parseLiveCampaignMetadata>>, stats: ReturnType<typeof computeLiveCampaignStats>) {
  const today = dateKey(new Date())
  const overdueTasks = metadata.tasks.filter((task) => task.status === 'todo' && task.due_date && task.due_date < today)
  const dueSoonTasks = metadata.tasks.filter((task) => task.status === 'todo' && task.due_date && task.due_date >= today).slice(0, 3)
  const openCount = metadata.tasks.filter((task) => task.status === 'todo').length
  const completedCount = metadata.tasks.filter((task) => task.status === 'done').length
  const draftCount = metadata.logs.filter((log) => log.status === 'drafted').length
  const awaitingApprovalCount = metadata.logs.filter((log) => log.status === 'sent_for_approval').length
  const revisionCount = metadata.approvals.filter((entry) => entry.status === 'revision_requested').length

  const actions: Array<{ id: string; title: string; detail: string; priority: 'high' | 'medium' | 'low' }> = []

  if (stats.videosToday < metadata.daily_target) {
    actions.push({
      id: 'posting-gap',
      title: `Log ${metadata.daily_target - stats.videosToday} more post${metadata.daily_target - stats.videosToday === 1 ? '' : 's'} for today`,
      detail: `Daily target is ${metadata.daily_target}. Currently ${stats.videosToday} posted or approved today.`,
      priority: 'high',
    })
  }

  if (draftCount > 0) {
    actions.push({
      id: 'drafts-waiting',
      title: `${draftCount} draft${draftCount === 1 ? '' : 's'} still need posting`,
      detail: 'Move drafted content into posted or sent for approval once it is live or ready.',
      priority: 'high',
    })
  }

  if (awaitingApprovalCount > 0) {
    actions.push({
      id: 'awaiting-approval',
      title: `${awaitingApprovalCount} item${awaitingApprovalCount === 1 ? '' : 's'} waiting on client approval`,
      detail: 'Follow up or update the approval tracker once the client responds.',
      priority: 'high',
    })
  }

  if (revisionCount > 0) {
    actions.push({
      id: 'revisions-open',
      title: `${revisionCount} revision request${revisionCount === 1 ? '' : 's'} open`,
      detail: 'Use the approvals tracker to keep revision loops visible.',
      priority: 'high',
    })
  }

  if (overdueTasks.length > 0) {
    actions.push({
      id: 'overdue-tasks',
      title: `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'} need attention`,
      detail: overdueTasks.slice(0, 2).map((task) => task.title).join(' · '),
      priority: 'high',
    })
  }

  if (dueSoonTasks.length > 0) {
    actions.push({
      id: 'due-soon',
      title: 'Knock out the next due tasks',
      detail: dueSoonTasks.map((task) => task.title).join(' · '),
      priority: 'medium',
    })
  }

  if (metadata.client_feedback.length === 0) {
    actions.push({
      id: 'feedback-empty',
      title: 'Log the latest client feedback',
      detail: 'Capture quick comments, blockers, and direction changes in the tracker.',
      priority: 'medium',
    })
  }

  if (metadata.internal_notes.trim().length === 0) {
    actions.push({
      id: 'notes-empty',
      title: 'Add internal notes for this client',
      detail: 'Capture feedback, blockers, angles that worked, and what to change next.',
      priority: 'medium',
    })
  }

  if (actions.length === 0) {
    actions.push({
      id: 'steady-state',
      title: 'Campaign looks covered today',
      detail: `${completedCount} completed task${completedCount === 1 ? '' : 's'} and ${openCount} open task${openCount === 1 ? '' : 's'} remaining.`,
      priority: 'low',
    })
  }

  return actions.slice(0, 5)
}

function buildActivityTimeline(metadata: NonNullable<ReturnType<typeof parseLiveCampaignMetadata>>, stats: ReturnType<typeof computeLiveCampaignStats>) {
  const timeline: Array<{
    id: string
    type: 'campaign_started' | 'content_logged' | 'task_created' | 'task_completed' | 'notes_updated' | 'status_snapshot'
    title: string
    detail: string
    date: string
    created_at: string
  }> = []

  timeline.push({
    id: 'campaign-start',
    type: 'campaign_started',
    title: 'Campaign started',
    detail: `${metadata.client_name} live retainer began with ${metadata.daily_target} posts/day expected.`,
    date: metadata.start_date,
    created_at: new Date(`${metadata.start_date}T12:00:00Z`).toISOString(),
  })

  for (const log of metadata.logs.slice(0, 12)) {
    timeline.push({
      id: `log-${log.id}`,
      type: 'content_logged',
      title: `${log.platform} content ${log.status.replaceAll('_', ' ')}`,
      detail: [
        log.video_url ? log.video_url : 'No live link yet',
        log.notes.hook ? `Hook: ${log.notes.hook}` : '',
      ].filter(Boolean).join(' · '),
      date: log.date,
      created_at: log.created_at,
    })
  }

  for (const task of metadata.tasks.slice(0, 12)) {
    timeline.push({
      id: `task-created-${task.id}`,
      type: 'task_created',
      title: 'Task added',
      detail: task.title,
      date: task.created_at.slice(0, 10),
      created_at: task.created_at,
    })

    if (task.status === 'done' && task.completed_at) {
      timeline.push({
        id: `task-done-${task.id}`,
        type: 'task_completed',
        title: 'Task completed',
        detail: task.title,
        date: task.completed_at.slice(0, 10),
        created_at: task.completed_at,
      })
    }
  }

  if (metadata.notes_updated_at) {
    timeline.push({
      id: 'notes-updated',
      type: 'notes_updated',
      title: 'Internal notes updated',
      detail: 'Campaign notes were refreshed for the creator workspace.',
      date: metadata.notes_updated_at.slice(0, 10),
      created_at: metadata.notes_updated_at,
    })
  }

  timeline.push({
    id: 'status-snapshot',
    type: 'status_snapshot',
    title: stats.status === 'on_track' ? 'Campaign is on track' : stats.status === 'behind' ? 'Campaign pacing is behind' : 'Campaign has not started posting yet',
    detail: `${stats.videosThisMonth} posted or approved pieces logged this month against ${stats.monthlyTargetToDate} expected by now.`,
    date: dateKey(new Date()),
    created_at: new Date().toISOString(),
  })

  return timeline.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.created_at.localeCompare(a.created_at)
  }).slice(0, 20)
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params

    const { data, error } = await auth.admin
      .from('deals')
      .select('id, creator_id, brand_id, job_id, amount, status, created_at, updated_at, submitted_notes, brands(company_name, logo_url, website, industry), jobs(title, description, deliverables)')
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })

    if (auth.role === 'brand') {
      if (!auth.brandId || data.brand_id !== auth.brandId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (!auth.creatorId || data.creator_id !== auth.creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deal = data as DealRow
    const metadata = parseLiveCampaignMetadata(deal.submitted_notes)
    if (!metadata) {
      return NextResponse.json({ error: 'This deal is not configured as a live campaign.' }, { status: 400 })
    }

    const brand = relationOne(deal.brands)
    const job = relationOne(deal.jobs)
    const logs = sortLogsDesc(metadata.logs)
    const tasks = sortTasks(metadata.tasks)
    const clientFeedback = sortFeedbackDesc(metadata.client_feedback)
    const approvals = sortApprovalsDesc(metadata.approvals)
    const normalizedMetadata = { ...metadata, logs, tasks, client_feedback: clientFeedback, approvals }
    const stats = computeLiveCampaignStats(normalizedMetadata)

    const recentLogs = logs.slice(0, 12)
    const viewsByPlatform = metadata.platforms.map((platform) => ({
      platform,
      views: logs
        .filter((log) => log.platform === platform && (log.status === 'posted' || log.status === 'approved'))
        .reduce((sum, log) => sum + Math.max(0, Number(log.views || 0)), 0),
    }))

    const latestPostedLog = logs.find((log) => log.status === 'posted' || log.status === 'approved') || null
    const today = dateKey(new Date())
    const overdueTasks = tasks.filter((task) => task.status === 'todo' && task.due_date && task.due_date < today).length
    const openTasks = tasks.filter((task) => task.status === 'todo').length
    const completedTasks = tasks.filter((task) => task.status === 'done').length
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
    const upcomingDeadlines = tasks
      .filter((task) => task.status === 'todo' && task.due_date)
      .slice(0, 4)
      .map((task) => ({
        id: task.id,
        title: task.title,
        due_date: task.due_date,
      }))

    const logsSummary = {
      drafted_count: logs.filter((log) => log.status === 'drafted').length,
      posted_count: logs.filter((log) => log.status === 'posted').length,
      sent_for_approval_count: logs.filter((log) => log.status === 'sent_for_approval').length,
      approved_count: logs.filter((log) => log.status === 'approved').length,
    }

    const approvalsSummary = {
      sent_for_approval_count: approvals.filter((entry) => entry.status === 'sent_for_approval').length,
      approved_count: approvals.filter((entry) => entry.status === 'approved').length,
      revision_requested_count: approvals.filter((entry) => entry.status === 'revision_requested').length,
    }

    const notes = [
      `Primary retainer for ${metadata.client_name}.`,
      `${metadata.daily_target} repurposed posts expected per day across ${metadata.platforms.length} platform${metadata.platforms.length === 1 ? '' : 's'}.`,
      stats.status === 'on_track'
        ? 'Posting pace is currently on track against the month-to-date target.'
        : stats.status === 'behind'
          ? 'Posting pace is behind the month-to-date target and needs attention.'
          : 'No posted or approved content logged yet for the current month.',
    ]

    return NextResponse.json({
      campaign: {
        id: deal.id,
        title: job?.title || `${metadata.client_name} live campaign`,
        client_name: metadata.client_name,
        avatar_url: brand?.logo_url || null,
        website: brand?.website || null,
        industry: brand?.industry || null,
        amount: Number(deal.amount || metadata.monthly_rate || 0),
        status: String(deal.status || 'in_progress'),
        campaign_status: stats.status,
        start_date: metadata.start_date,
        contract_days: metadata.contract_days,
        days_active: stats.daysActive,
        daily_target: metadata.daily_target,
        monthly_rate: metadata.monthly_rate,
        platforms: metadata.platforms,
        description: job?.description || null,
        deliverables: job?.deliverables || null,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
      },
      summary: {
        progress_percent: stats.progressPercent,
        monthly_target_to_date: stats.monthlyTargetToDate,
        videos_today: stats.videosToday,
        videos_this_week: stats.videosThisWeek,
        videos_this_month: stats.videosThisMonth,
        views_this_month: stats.viewsThisMonth,
        total_videos: stats.totalVideos,
        total_views: stats.totalViews,
        earned_prorated: stats.earnedProrated,
        latest_post_date: latestPostedLog?.date || null,
        latest_post_platform: latestPostedLog?.platform || null,
      },
      goals: summarizeGoals(normalizedMetadata, stats),
      views_by_platform: viewsByPlatform,
      notes,
      internal_notes: {
        body: normalizedMetadata.internal_notes,
        updated_at: normalizedMetadata.notes_updated_at,
      },
      tasks,
      task_summary: {
        open_count: openTasks,
        completed_count: completedTasks,
        overdue_count: overdueTasks,
        completion_rate: completionRate,
        upcoming_deadlines: upcomingDeadlines,
      },
      logs_summary: logsSummary,
      approvals_summary: approvalsSummary,
      next_actions: buildNextActions(normalizedMetadata, stats),
      activity_timeline: buildActivityTimeline(normalizedMetadata, stats),
      recent_logs: recentLogs,
      client_feedback: clientFeedback,
      approvals,
      placeholders: {
        next_review: stats.daysActive >= 7 ? 'Weekly client check-in ready' : 'First weekly check-in not reached yet',
        approvals: approvals.length > 0 ? 'Using tracker below' : 'Add approvals or revision events manually below',
        client_feedback: clientFeedback.length > 0 ? 'Using tracker below' : 'Add quick client feedback notes below',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load campaign.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)

    const { data: deal, error } = await auth.admin
      .from('deals')
      .select('id, creator_id, brand_id, submitted_notes')
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!deal) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })

    if (auth.role === 'brand') {
      if (!auth.brandId || deal.brand_id !== auth.brandId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else if (!auth.creatorId || deal.creator_id !== auth.creatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const metadata = parseLiveCampaignMetadata(deal.submitted_notes)
    if (!metadata) {
      return NextResponse.json({ error: 'This deal is not configured as a live campaign.' }, { status: 400 })
    }

    let nextMetadata = { ...metadata }
    let changed = false

    if (body && typeof body.internal_notes === 'string') {
      nextMetadata = {
        ...nextMetadata,
        internal_notes: body.internal_notes.trim(),
        notes_updated_at: new Date().toISOString(),
      }
      changed = true
    }

    if (body?.task && typeof body.task === 'object') {
      const action = typeof body.task.action === 'string' ? body.task.action : ''
      const nowIso = new Date().toISOString()

      if (action === 'create') {
        const title = typeof body.task.title === 'string' ? body.task.title.trim() : ''
        if (!title) return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })

        const nextTask = {
          id: crypto.randomUUID(),
          title,
          detail: typeof body.task.detail === 'string' ? body.task.detail.trim() : '',
          due_date: typeof body.task.due_date === 'string' && body.task.due_date ? body.task.due_date : null,
          status: 'todo' as const,
          created_at: nowIso,
          completed_at: null,
        }

        nextMetadata = {
          ...nextMetadata,
          tasks: sortTasks([nextTask, ...nextMetadata.tasks]),
        }
        changed = true
      }

      if (action === 'toggle') {
        const taskId = typeof body.task.id === 'string' ? body.task.id : ''
        if (!taskId) return NextResponse.json({ error: 'Task id is required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          tasks: sortTasks(nextMetadata.tasks.map((task) => {
            if (task.id !== taskId) return task
            const nextStatus = task.status === 'done' ? 'todo' : 'done'
            return {
              ...task,
              status: nextStatus,
              completed_at: nextStatus === 'done' ? nowIso : null,
            }
          })),
        }
        changed = true
      }

      if (action === 'update') {
        const taskId = typeof body.task.id === 'string' ? body.task.id : ''
        const title = typeof body.task.title === 'string' ? body.task.title.trim() : ''
        if (!taskId || !title) return NextResponse.json({ error: 'Task id and title are required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          tasks: sortTasks(nextMetadata.tasks.map((task) => task.id === taskId
            ? {
              ...task,
              title,
              detail: typeof body.task.detail === 'string' ? body.task.detail.trim() : task.detail,
              due_date: typeof body.task.due_date === 'string'
                ? (body.task.due_date || null)
                : task.due_date,
            }
            : task)),
        }
        changed = true
      }

      if (action === 'delete') {
        const taskId = typeof body.task.id === 'string' ? body.task.id : ''
        if (!taskId) return NextResponse.json({ error: 'Task id is required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          tasks: sortTasks(nextMetadata.tasks.filter((task) => task.id !== taskId)),
        }
        changed = true
      }
    }

    if (body?.log && typeof body.log === 'object') {
      const action = typeof body.log.action === 'string' ? body.log.action : ''
      const nowIso = new Date().toISOString()

      if (action === 'update') {
        const logId = typeof body.log.id === 'string' ? body.log.id : ''
        if (!logId) return NextResponse.json({ error: 'Log id is required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          logs: sortLogsDesc(nextMetadata.logs.map((log) => log.id === logId
            ? {
              ...log,
              video_url: typeof body.log.video_url === 'string' ? body.log.video_url.trim() : log.video_url,
              views: Number.isFinite(Number(body.log.views)) ? Math.max(0, Math.round(Number(body.log.views))) : log.views,
              date: typeof body.log.date === 'string' && body.log.date ? body.log.date : log.date,
              status: normalizeLogStatus(body.log.status),
              notes: {
                hook: typeof body.log.notes?.hook === 'string' ? body.log.notes.hook.trim() : log.notes.hook,
                concept: typeof body.log.notes?.concept === 'string' ? body.log.notes.concept.trim() : log.notes.concept,
                context: typeof body.log.notes?.context === 'string' ? body.log.notes.context.trim() : log.notes.context,
              },
              created_at: log.created_at || nowIso,
            }
            : log)),
        }
        changed = true
      }

      if (action === 'delete') {
        const logId = typeof body.log.id === 'string' ? body.log.id : ''
        if (!logId) return NextResponse.json({ error: 'Log id is required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          logs: sortLogsDesc(nextMetadata.logs.filter((log) => log.id !== logId)),
        }
        changed = true
      }
    }

    if (body?.feedback && typeof body.feedback === 'object') {
      const action = typeof body.feedback.action === 'string' ? body.feedback.action : ''

      if (action === 'create') {
        const feedbackBody = typeof body.feedback.body === 'string' ? body.feedback.body.trim() : ''
        if (!feedbackBody) return NextResponse.json({ error: 'Feedback text is required.' }, { status: 400 })
        const date = typeof body.feedback.date === 'string' && body.feedback.date ? body.feedback.date : dateKey(new Date())

        nextMetadata = {
          ...nextMetadata,
          client_feedback: sortFeedbackDesc([
            {
              id: crypto.randomUUID(),
              body: feedbackBody,
              source: typeof body.feedback.source === 'string' ? body.feedback.source.trim() : '',
              date,
              created_at: new Date().toISOString(),
            },
            ...nextMetadata.client_feedback,
          ]),
        }
        changed = true
      }

      if (action === 'delete') {
        const feedbackId = typeof body.feedback.id === 'string' ? body.feedback.id : ''
        if (!feedbackId) return NextResponse.json({ error: 'Feedback id is required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          client_feedback: sortFeedbackDesc(nextMetadata.client_feedback.filter((entry) => entry.id !== feedbackId)),
        }
        changed = true
      }
    }

    if (body?.approval && typeof body.approval === 'object') {
      const action = typeof body.approval.action === 'string' ? body.approval.action : ''

      if (action === 'create') {
        const title = typeof body.approval.title === 'string' ? body.approval.title.trim() : ''
        if (!title) return NextResponse.json({ error: 'Approval title is required.' }, { status: 400 })
        const date = typeof body.approval.date === 'string' && body.approval.date ? body.approval.date : dateKey(new Date())

        nextMetadata = {
          ...nextMetadata,
          approvals: sortApprovalsDesc([
            {
              id: crypto.randomUUID(),
              title,
              status: normalizeApprovalStatus(body.approval.status),
              detail: typeof body.approval.detail === 'string' ? body.approval.detail.trim() : '',
              date,
              created_at: new Date().toISOString(),
            },
            ...nextMetadata.approvals,
          ]),
        }
        changed = true
      }

      if (action === 'delete') {
        const approvalId = typeof body.approval.id === 'string' ? body.approval.id : ''
        if (!approvalId) return NextResponse.json({ error: 'Approval id is required.' }, { status: 400 })

        nextMetadata = {
          ...nextMetadata,
          approvals: sortApprovalsDesc(nextMetadata.approvals.filter((entry) => entry.id !== approvalId)),
        }
        changed = true
      }
    }

    if (!changed) {
      return NextResponse.json({ error: 'No valid campaign updates provided.' }, { status: 400 })
    }

    const { error: updateError } = await auth.admin
      .from('deals')
      .update({ submitted_notes: serializeLiveCampaignMetadata(nextMetadata) })
      .eq('id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update campaign.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
