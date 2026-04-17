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

export async function GET(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')?.trim()

  let query = auth.admin
    .from('campaigns')
    .select('id, client_id, name, start_date, end_date, status, platforms, notes, tiktok_url, instagram_url, youtube_url, facebook_url, created_at, clients(id, name, brand_color)')
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)

  const clientId = String(body?.client_id || '').trim()
  const name = String(body?.name || '').trim()
  const startDate = String(body?.start_date || '').trim()
  const endDate = String(body?.end_date || '').trim()
  const notes = String(body?.notes || '').trim()
  const status = parseStatus(body?.status)
  const platforms = parsePlatforms(body?.platforms)

  const tiktokUrl = parseOptionalUrl(body?.tiktok_url)
  const instagramUrl = parseOptionalUrl(body?.instagram_url)
  const youtubeUrl = parseOptionalUrl(body?.youtube_url)
  const facebookUrl = parseOptionalUrl(body?.facebook_url)

  const goals = parseGoalsInput(body?.goals)
  const singleGoal = parseGoalObject(body?.goal)

  if (singleGoal) {
    const index = goals.findIndex((goal) => goal.platform === singleGoal.platform)
    if (index >= 0) goals[index] = singleGoal
    else goals.push(singleGoal)
  }

  if (!clientId || !name || !startDate || !status) {
    return NextResponse.json({ error: 'client_id, name, start_date, and valid status are required.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('campaigns')
    .insert({
      client_id: clientId,
      name,
      start_date: startDate,
      end_date: endDate || null,
      status,
      platforms,
      notes: notes || null,
      tiktok_url: tiktokUrl,
      instagram_url: instagramUrl,
      youtube_url: youtubeUrl,
      facebook_url: facebookUrl,
    })
    .select('id, client_id, name, start_date, end_date, status, platforms, notes, tiktok_url, instagram_url, youtube_url, facebook_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (goals.length) {
    const goalRows = goals.map((goal) => ({
      campaign_id: data.id,
      platform: goal.platform,
      target_per_month: goal.target_per_month,
    }))

    const { error: goalsError } = await auth.admin.from('campaign_goals').upsert(goalRows, {
      onConflict: 'campaign_id,platform',
    })

    if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 500 })
  }

  const { data: goalData, error: goalLoadError } = await auth.admin
    .from('campaign_goals')
    .select('id, campaign_id, platform, target_per_month, created_at, updated_at')
    .eq('campaign_id', data.id)
    .order('platform', { ascending: true })

  if (goalLoadError) return NextResponse.json({ error: goalLoadError.message }, { status: 500 })

  return NextResponse.json({ campaign: { ...data, goals: goalData || [] } }, { status: 201 })
}
