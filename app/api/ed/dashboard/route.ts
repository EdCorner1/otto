import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext, toMonthStartIso } from '@/lib/ed-server'

export const runtime = 'nodejs'

type PostWithClient = {
  views: number | null
  platform: string | null
  campaigns: {
    client_id: string
    clients: {
      id: string
      name: string
      brand_color: string | null
    } | null
  } | null
}

type CampaignStatusRow = {
  status: string
  client_id: string
}

export async function GET(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const monthStartIso = toMonthStartIso()

  const [{ count: totalClients, error: clientsError }, { data: activeCampaignRows, error: campaignsError }, { data: postsMonth, error: postsError }] = await Promise.all([
    auth.admin.from('clients').select('id', { count: 'exact', head: true }),
    auth.admin.from('campaigns').select('status, client_id').eq('status', 'active'),
    auth.admin
      .from('campaign_posts')
      .select('views, platform, campaigns!inner(client_id, clients(id, name, brand_color))')
      .gte('posted_at', monthStartIso),
  ])

  if (clientsError) return NextResponse.json({ error: clientsError.message }, { status: 500 })
  if (campaignsError) return NextResponse.json({ error: campaignsError.message }, { status: 500 })
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

  const activeCampaigns = (activeCampaignRows || []) as CampaignStatusRow[]
  const postRows = (postsMonth || []) as unknown as PostWithClient[]

  const totalViewsMonth = postRows.reduce((sum, row) => sum + Number(row.views || 0), 0)
  const totalVideosMonth = postRows.length

  const clientViewsMap = new Map<string, { id: string; name: string; brand_color: string | null; total_views_month: number }>()
  const platformMap = new Map<string, number>()

  for (const row of postRows) {
    const views = Number(row.views || 0)

    const platform = row.platform || 'Unknown'
    platformMap.set(platform, (platformMap.get(platform) || 0) + views)

    const client = row.campaigns?.clients
    if (!client?.id) continue

    const existing = clientViewsMap.get(client.id) || {
      id: client.id,
      name: client.name,
      brand_color: client.brand_color,
      total_views_month: 0,
    }

    existing.total_views_month += views
    clientViewsMap.set(client.id, existing)
  }

  const activeCampaignsByClient = activeCampaigns.reduce<Record<string, number>>((acc, campaign) => {
    acc[campaign.client_id] = (acc[campaign.client_id] || 0) + 1
    return acc
  }, {})

  const clients = Array.from(clientViewsMap.values())
    .map((client) => ({
      ...client,
      active_campaigns: activeCampaignsByClient[client.id] || 0,
    }))
    .sort((a, b) => b.total_views_month - a.total_views_month)

  const platform_breakdown = Array.from(platformMap.entries()).map(([platform, views]) => ({
    platform,
    views,
  }))

  return NextResponse.json({
    total_views_month: totalViewsMonth,
    total_videos_month: totalVideosMonth,
    total_clients: totalClients || 0,
    total_active_campaigns: activeCampaigns.length,
    clients,
    platform_breakdown,
  })
}
