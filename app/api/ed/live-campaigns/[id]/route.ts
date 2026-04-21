import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeLiveCampaignStats,
  parseLiveCampaignMetadata,
  sortLogsDesc,
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
    const stats = computeLiveCampaignStats({ ...metadata, logs })

    const recentLogs = logs.slice(0, 8)
    const viewsByPlatform = metadata.platforms.map((platform) => ({
      platform,
      views: logs.filter((log) => log.platform === platform).reduce((sum, log) => sum + Math.max(0, Number(log.views || 0)), 0),
    }))

    const latestPost = logs[0] || null
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
      goals: summarizeGoals(metadata, stats),
      views_by_platform: viewsByPlatform,
      notes,
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
