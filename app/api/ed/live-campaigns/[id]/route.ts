import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeLiveCampaignStats,
  dateKey,
  parseLiveCampaignMetadata,
  serializeLiveCampaignMetadata,
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
  const targetPerPlatform = metadata.platforms.length > 0
    ? Math.max(1, Math.round(metadata.daily_target / metadata.platforms.length))
    : metadata.daily_target

  return metadata.platforms.map((platform) => {
    const totalPosts = metadata.logs.filter((log) => log.platform === platform).length
    const monthPosts = metadata.logs.filter((log) => {
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
  const completedCount = metadata.tasks.filter((task) => task.status === 'done').length
  const openCount = metadata.tasks.filter((task) => task.status === 'todo').length

  const actions: Array<{ id: string; title: string; detail: string; priority: 'high' | 'medium' | 'low' }> = []

  if (stats.videosToday < metadata.daily_target) {
    actions.push({
      id: 'posting-gap',
      title: `Log ${metadata.daily_target - stats.videosToday} more post${metadata.daily_target - stats.videosToday === 1 ? '' : 's'} for today`,
      detail: `Daily target is ${metadata.daily_target}. Currently ${stats.videosToday} logged today.`,
      priority: 'high',
    })
  }

  if (stats.status === 'behind') {
    actions.push({
      id: 'pace-behind',
      title: 'Catch campaign back up to target pace',
      detail: `${stats.videosThisMonth} posts logged against ${stats.monthlyTargetToDate} expected by now.`,
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

  return actions.slice(0, 4)
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
      title: `${log.platform} post logged`,
      detail: `${log.views.toLocaleString()} views tracked for ${log.video_url}`,
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
    title: stats.status === 'on_track' ? 'Campaign is on track' : stats.status === 'behind' ? 'Campaign pacing is behind' : 'Campaign has not started logging yet',
    detail: `${stats.videosThisMonth} posts logged this month against ${stats.monthlyTargetToDate} expected by now.`,
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
    const normalizedMetadata = { ...metadata, logs, tasks }
    const stats = computeLiveCampaignStats(normalizedMetadata)

    const recentLogs = logs.slice(0, 8)
    const viewsByPlatform = metadata.platforms.map((platform) => ({
      platform,
      views: logs.filter((log) => log.platform === platform).reduce((sum, log) => sum + Math.max(0, Number(log.views || 0)), 0),
    }))

    const latestPost = logs[0] || null
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

    const notes = [
      `Primary retainer for ${metadata.client_name}.`,
      `${metadata.daily_target} repurposed posts expected per day across ${metadata.platforms.length} platform${metadata.platforms.length === 1 ? '' : 's'}.`,
      stats.status === 'on_track'
        ? 'Posting pace is currently on track against the month-to-date target.'
        : stats.status === 'behind'
          ? 'Posting pace is behind the month-to-date target and needs attention.'
          : 'No posts logged yet for the current month.',
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
        latest_post_date: latestPost?.date || null,
        latest_post_platform: latestPost?.platform || null,
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
      next_actions: buildNextActions(normalizedMetadata, stats),
      activity_timeline: buildActivityTimeline(normalizedMetadata, stats),
      recent_logs: recentLogs,
      placeholders: {
        next_review: stats.daysActive >= 7 ? 'Weekly client check-in ready' : 'First weekly check-in not reached yet',
        approvals: 'Track approvals and revisions manually for now',
        client_feedback: 'No client feedback feed connected yet',
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
