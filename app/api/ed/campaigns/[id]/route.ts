import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext, parsePlatforms, parseStatus } from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const [{ data: campaign, error: campaignError }, { data: posts, error: postsError }, { data: team, error: teamError }] = await Promise.all([
    auth.admin
      .from('campaigns')
      .select('id, client_id, name, start_date, end_date, status, platforms, notes, created_at, clients(id, name, brand_color, logo_url)')
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
  ])

  if (campaignError) return NextResponse.json({ error: campaignError.message }, { status: 500 })
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })
  if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })

  return NextResponse.json({
    campaign,
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

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  if (typeof patch.name === 'string' && !patch.name) {
    return NextResponse.json({ error: 'Campaign name cannot be empty.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('campaigns')
    .update(patch)
    .eq('id', id)
    .select('id, client_id, name, start_date, end_date, status, platforms, notes, created_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })

  return NextResponse.json({ campaign: data })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const { error } = await auth.admin.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
