import { NextRequest, NextResponse } from 'next/server'
import { computeGoalProgress, getEdAuthContext, getMonthDateRange } from '@/lib/ed-server'

export const runtime = 'nodejs'

type PostWithClient = {
  campaign_id: string
  views: number | null
  platform: string | null
  posted_at: string
  campaigns: {
    client_id: string
    clients: {
      id: string
      name: string
      brand_color: string | null
    } | null
  } | null
}

type CampaignRow = {
  id: string
  client_id: string
  status: string
}

type GoalRow = {
  campaign_id: string
  platform: string
  target_per_month: number
}

export async function GET(request: NextRequest) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { startIso: monthStartIso, endIso: nextMonthStartIso, daysElapsed, totalDaysInMonth } = getMonthDateRange()

  const [
    { count: totalClients, error: clientsError },
    { data: campaignRows, error: campaignsError },
    { data: postsMonth, error: postsError },
  ] = await Promise.all([
    auth.admin.from('clients').select('id', { count: 'exact', head: true }),
    auth.admin.from('campaigns').select('id, status, client_id'),
    auth.admin
      .from('campaign_posts')
      .select('campaign_id, views, platform, posted_at, campaigns!inner(client_id, clients(id, name, brand_color))')
      .gte('posted_at', monthStartIso)
      .lt('posted_at', nextMonthStartIso),
  ])

  if (clientsError) return NextResponse.json({ error: clientsError.message }, { status: 500 })
  if (campaignsError) return NextResponse.json({ error: campaignsError.message }, { status: 500 })
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

  const campaigns = (campaignRows || []) as CampaignRow[]
  const postRows = (postsMonth || []) as unknown as PostWithClient[]
  const campaignIds = campaigns.map((campaign) => campaign.id)

  let goalRows: GoalRow[] = []
  if (campaignIds.length) {
    const { data: goals, error: goalsError } = await auth.admin
      .from('campaign_goals')
      .select('campaign_id, platform, target_per_month')
      .in('campaign_id', campaignIds)

    if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 500 })
    goalRows = (goals || []) as GoalRow[]
  }

  const totalViewsMonth = postRows.reduce((sum, row) => sum + Number(row.views || 0), 0)
  const totalVideosMonth = postRows.length

  const clientViewsMap = new Map<string, { id: string; name: string; brand_color: string | null; total_views_month: number }>()
  const platformMap = new Map<string, number>()

  const monthPostsByCampaignAndPlatform = new Map<string, number>()
  const monthPostsByCampaignAll = new Map<string, number>()

  for (const row of postRows) {
    const views = Number(row.views || 0)
    const platform = row.platform || 'Unknown'
    const campaignId = row.campaign_id

    platformMap.set(platform, (platformMap.get(platform) || 0) + views)

    monthPostsByCampaignAndPlatform.set(`${campaignId}::${platform}`, (monthPostsByCampaignAndPlatform.get(`${campaignId}::${platform}`) || 0) + 1)
    monthPostsByCampaignAll.set(campaignId, (monthPostsByCampaignAll.get(campaignId) || 0) + 1)

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

  const activeCampaignsByClient = campaigns
    .filter((campaign) => campaign.status === 'active')
    .reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.client_id] = (acc[campaign.client_id] || 0) + 1
      return acc
    }, {})

  const goalsByCampaign = new Map<string, GoalRow[]>()
  for (const goal of goalRows) {
    const existing = goalsByCampaign.get(goal.campaign_id) || []
    existing.push(goal)
    goalsByCampaign.set(goal.campaign_id, existing)
  }

  const campaignGoalStatus = new Map<string, 'on_track' | 'behind' | 'not_started'>()
  for (const campaign of campaigns) {
    const goals = goalsByCampaign.get(campaign.id) || []

    if (!goals.length) {
      campaignGoalStatus.set(campaign.id, (monthPostsByCampaignAll.get(campaign.id) || 0) > 0 ? 'on_track' : 'not_started')
      continue
    }

    const statuses = goals.map((goal) => {
      const actualPosts =
        goal.platform === 'All'
          ? Number(monthPostsByCampaignAll.get(campaign.id) || 0)
          : Number(monthPostsByCampaignAndPlatform.get(`${campaign.id}::${goal.platform}`) || 0)

      return computeGoalProgress({
        targetPerMonth: Number(goal.target_per_month || 0),
        actualPostsThisMonth: actualPosts,
        daysElapsed,
        totalDaysInMonth,
      }).status
    })

    const overall = statuses.every((status) => status === 'not_started')
      ? 'not_started'
      : statuses.some((status) => status === 'behind')
        ? 'behind'
        : 'on_track'

    campaignGoalStatus.set(campaign.id, overall)
  }

  const goalStatusByClient = campaigns.reduce<Record<string, { on_track: number; behind: number; not_started: number }>>((acc, campaign) => {
    const status = campaignGoalStatus.get(campaign.id) || 'not_started'
    if (!acc[campaign.client_id]) {
      acc[campaign.client_id] = { on_track: 0, behind: 0, not_started: 0 }
    }
    acc[campaign.client_id][status] += 1
    return acc
  }, {})

  const clients = Array.from(clientViewsMap.values())
    .map((client) => ({
      ...client,
      active_campaigns: activeCampaignsByClient[client.id] || 0,
      goal_status_counts: goalStatusByClient[client.id] || { on_track: 0, behind: 0, not_started: 0 },
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
    total_active_campaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
    clients,
    platform_breakdown,
  })
}
