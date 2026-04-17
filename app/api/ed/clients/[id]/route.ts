import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext } from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

type CampaignRow = {
  id: string
  client_id: string
  name: string
  start_date: string
  end_date: string | null
  status: string
  platforms: string[] | null
  notes: string | null
  created_at: string
}

type CampaignPostRow = {
  campaign_id: string
  views: number | null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const { data: client, error: clientError } = await auth.admin
    .from('clients')
    .select('id, name, brand_color, logo_url, created_at')
    .eq('id', id)
    .maybeSingle()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })
  if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })

  const { data: campaigns, error: campaignsError } = await auth.admin
    .from('campaigns')
    .select('id, client_id, name, start_date, end_date, status, platforms, notes, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  if (campaignsError) return NextResponse.json({ error: campaignsError.message }, { status: 500 })

  const campaignRows = (campaigns || []) as CampaignRow[]
  const campaignIds = campaignRows.map((campaign) => campaign.id)

  let postRows: CampaignPostRow[] = []
  if (campaignIds.length) {
    const { data: posts, error: postsError } = await auth.admin
      .from('campaign_posts')
      .select('campaign_id, views')
      .in('campaign_id', campaignIds)

    if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })
    postRows = (posts || []) as CampaignPostRow[]
  }

  const postStatsByCampaign = postRows.reduce<Record<string, { total_views: number; post_count: number }>>((acc, row) => {
    const existing = acc[row.campaign_id] || { total_views: 0, post_count: 0 }
    existing.total_views += Number(row.views || 0)
    existing.post_count += 1
    acc[row.campaign_id] = existing
    return acc
  }, {})

  const campaignsWithStats = campaignRows.map((campaign) => ({
    ...campaign,
    total_views: postStatsByCampaign[campaign.id]?.total_views || 0,
    post_count: postStatsByCampaign[campaign.id]?.post_count || 0,
  }))

  return NextResponse.json({
    client,
    campaigns: campaignsWithStats,
  })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  const body = await request.json().catch(() => null)

  const patch: Record<string, unknown> = {}

  if (typeof body?.name === 'string') patch.name = body.name.trim()
  if (typeof body?.brand_color === 'string') patch.brand_color = body.brand_color.trim()
  if (typeof body?.logo_url === 'string') {
    const logo = body.logo_url.trim()
    patch.logo_url = logo || null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  if (typeof patch.name === 'string' && !patch.name) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('clients')
    .update(patch)
    .eq('id', id)
    .select('id, name, brand_color, logo_url, created_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })

  return NextResponse.json({ client: data })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const { error } = await auth.admin.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
