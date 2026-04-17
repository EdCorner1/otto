import { NextRequest, NextResponse } from 'next/server'
import {
  getEdAuthContext,
  parseGoalPlatform,
  parseOptionalUrl,
  parsePlatforms,
  parseStatus,
  parseTargetPosts,
} from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }
type GoalInput = { platform: string; target_per_month: number }

function parseGoalsInput(input: unknown): GoalInput[] {
  if (!Array.isArray(input)) return []

  const mapped: GoalInput[] = []

  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const row = item as { platform?: unknown; target_per_month?: unknown }
    const platform = parseGoalPlatform(row.platform)
    if (!platform) continue

    mapped.push({
      platform,
      target_per_month: parseTargetPosts(row.target_per_month),
    })
  }

  const byPlatform = new Map<string, GoalInput>()
  for (const goal of mapped) byPlatform.set(goal.platform, goal)
  return Array.from(byPlatform.values())
}

function parseGoalObject(input: unknown): GoalInput | null {
  if (!input || typeof input !== 'object') return null
  const goal = input as { platform?: unknown; target_per_month?: unknown }
  const platform = parseGoalPlatform(goal.platform)
  if (!platform) return null
  return {
    platform,
    target_per_month: parseTargetPosts(goal.target_per_month),
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const [
    { data: campaign, error: campaignError },
    { data: posts, error: postsError },
    { data: team, error: teamError },
    { data: goals, error: goalsError },
  ] = await Promise.all([
    auth.admin
      .from('campaigns')
      .select('id, client_id, name, start_date, end_date, status, platforms, notes, tiktok_url, instagram_url, youtube_url, facebook_url, created_at, clients(id, name, brand_color, logo_url)')
      .eq('id', id)
      .maybeSingle(),
    auth.admin
      .from('campaign_posts')
      .select('id, campaign_id, video_url, platform, views, likes, posted_at, created_at')
      .eq('campaign_id', id)
      .order('posted_at', { ascending: false }),
    auth.admin
      .from('campaign_team')
      .select('id, campaign_id, user_id, name, role, added_at')
      .eq('campaign_id', id)
      .order('added_at', { ascending: true }),
    auth.admin
      .from('campaign_goals')
      .select('id, campaign_id, platform, target_per_month, created_at, updated_at')
      .eq('campaign_id', id)
      .order('platform', { ascending: true }),
  ])

  if (campaignError) return NextResponse.json({ error: campaignError.message }, { status: 500 })
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })
  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 })
  if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 500 })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })

  return NextResponse.json({
    campaign: { ...campaign, goals: goals || [] },
    posts: posts || [],
    team: team || [],
  })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  const body = await request.json().catch(() => null)

  const patch: Record<string, unknown> = {}

  if (typeof body?.name === 'string') patch.name = body.name.trim()
  if (typeof body?.start_date === 'string') patch.start_date = body.start_date.trim()
  if (typeof body?.end_date === 'string') patch.end_date = body.end_date.trim() || null
  if (typeof body?.notes === 'string') patch.notes = body.notes.trim() || null

  if (body?.status !== undefined) {
    const status = parseStatus(body.status)
    if (!status) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    patch.status = status
  }

  if (body?.platforms !== undefined) {
    patch.platforms = parsePlatforms(body.platforms)
  }

  if (body?.tiktok_url !== undefined) patch.tiktok_url = parseOptionalUrl(body.tiktok_url)
  if (body?.instagram_url !== undefined) patch.instagram_url = parseOptionalUrl(body.instagram_url)
  if (body?.youtube_url !== undefined) patch.youtube_url = parseOptionalUrl(body.youtube_url)
  if (body?.facebook_url !== undefined) patch.facebook_url = parseOptionalUrl(body.facebook_url)

  const goals = parseGoalsInput(body?.goals)
  const singleGoal = parseGoalObject(body?.goal)

  if (singleGoal) {
    const index = goals.findIndex((goal) => goal.platform === singleGoal.platform)
    if (index >= 0) goals[index] = singleGoal
    else goals.push(singleGoal)
  }

  if (Object.keys(patch).length === 0 && goals.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  if (typeof patch.name === 'string' && !patch.name) {
    return NextResponse.json({ error: 'Campaign name cannot be empty.' }, { status: 400 })
  }

  if (Object.keys(patch).length) {
    const { error } = await auth.admin.from('campaigns').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (goals.length) {
    const goalRows = goals.map((goal) => ({
      campaign_id: id,
      platform: goal.platform,
      target_per_month: goal.target_per_month,
      updated_at: new Date().toISOString(),
    }))

    const { error: goalsError } = await auth.admin.from('campaign_goals').upsert(goalRows, {
      onConflict: 'campaign_id,platform',
    })

    if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 500 })
  }

  const [{ data, error }, { data: goalData, error: goalLoadError }] = await Promise.all([
    auth.admin
      .from('campaigns')
      .select('id, client_id, name, start_date, end_date, status, platforms, notes, tiktok_url, instagram_url, youtube_url, facebook_url, created_at')
      .eq('id', id)
      .maybeSingle(),
    auth.admin
      .from('campaign_goals')
      .select('id, campaign_id, platform, target_per_month, created_at, updated_at')
      .eq('campaign_id', id)
      .order('platform', { ascending: true }),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (goalLoadError) return NextResponse.json({ error: goalLoadError.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })

  return NextResponse.json({ campaign: { ...data, goals: goalData || [] } })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const { error } = await auth.admin.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
