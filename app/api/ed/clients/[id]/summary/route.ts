import { NextRequest, NextResponse } from 'next/server'
import { ED_PLATFORMS, computeGoalProgress, getEdAuthContext, getMonthDateRange } from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

type CampaignRow = {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  start_date: string
  tiktok_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  facebook_url: string | null
}

type GoalRow = {
  campaign_id: string
  platform: string
  target_per_month: number
}

type PostRow = {
  campaign_id: string
  platform: string
  views: number | null
  posted_at: string
}

function toIsoDay(dateString: string) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function sumMapValues(map: Map<string, number>) {
  let total = 0
  for (const value of map.values()) total += value
  return total
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  const { startIso: monthStartIso, endIso: nextMonthStartIso, daysElapsed, totalDaysInMonth } = getMonthDateRange()

  const [{ data: client }, { data: campaigns, error: campaignsError }] = await Promise.all([
    auth.admin.from('clients').select('id, name, brand_color, logo_url').eq('id', id).maybeSingle(),
    auth.admin
      .from('campaigns')
      .select('id, name, status, start_date, tiktok_url, instagram_url, youtube_url, facebook_url')
      .eq('client_id', id),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })
  if (campaignsError) return NextResponse.json({ error: campaignsError.message }, { status: 500 })

  const campaignRows = (campaigns || []) as CampaignRow[]
  const campaignIds = campaignRows.map((campaign) => campaign.id)

  if (!campaignIds.length) {
    return NextResponse.json({
      client,
      total_views_month: 0,
      total_videos_month: 0,
      total_campaigns: 0,
      active_campaigns: 0,
      top_post: null,
      campaign_breakdown: [],
      platform_breakdown: [],
      goal_status_counts: {
        on_track: 0,
        behind: 0,
        not_started: 0,
      },
    })
  }

  const [{ data: postsAll, error: postsAllError }, { data: goals, error: goalsError }] = await Promise.all([
    auth.admin
      .from('campaign_posts')
      .select('campaign_id, platform, views, posted_at')
      .in('campaign_id', campaignIds),
    auth.admin
      .from('campaign_goals')
      .select('campaign_id, platform, target_per_month')
      .in('campaign_id', campaignIds),
  ])

  if (postsAllError) return NextResponse.json({ error: postsAllError.message }, { status: 500 })
  if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 500 })

  const allRows = (postsAll || []) as PostRow[]
  const goalRows = (goals || []) as GoalRow[]

  const goalsByCampaign = new Map<string, GoalRow[]>()
  for (const goal of goalRows) {
    const existing = goalsByCampaign.get(goal.campaign_id) || []
    existing.push(goal)
    goalsByCampaign.set(goal.campaign_id, existing)
  }

  const postsByCampaign = new Map<string, PostRow[]>()
  for (const post of allRows) {
    const existing = postsByCampaign.get(post.campaign_id) || []
    existing.push(post)
    postsByCampaign.set(post.campaign_id, existing)
  }

  const clientMonthlyViewsByPlatform = new Map<string, number>()

  const campaignBreakdown = campaignRows.map((campaign) => {
    const campaignStartDate = toIsoDay(campaign.start_date)
    const posts = postsByCampaign.get(campaign.id) || []

    const lifetimePostsByPlatform = new Map<string, number>()
    const monthlyPostsByPlatform = new Map<string, number>()
    const lifetimeViewsByPlatform = new Map<string, number>()
    const monthlyViewsByPlatform = new Map<string, number>()

    for (const post of posts) {
      const postedAt = new Date(post.posted_at)
      if (Number.isNaN(postedAt.getTime())) continue

      const platform = post.platform || 'Unknown'
      const views = Number(post.views || 0)

      if (!campaignStartDate || postedAt >= campaignStartDate) {
        lifetimePostsByPlatform.set(platform, (lifetimePostsByPlatform.get(platform) || 0) + 1)
        lifetimeViewsByPlatform.set(platform, (lifetimeViewsByPlatform.get(platform) || 0) + views)
      }

      if (post.posted_at >= monthStartIso && post.posted_at < nextMonthStartIso) {
        monthlyPostsByPlatform.set(platform, (monthlyPostsByPlatform.get(platform) || 0) + 1)
        monthlyViewsByPlatform.set(platform, (monthlyViewsByPlatform.get(platform) || 0) + views)
      }
    }

    for (const [platform, views] of monthlyViewsByPlatform.entries()) {
      clientMonthlyViewsByPlatform.set(platform, (clientMonthlyViewsByPlatform.get(platform) || 0) + views)
    }

    const goalsForCampaign = goalsByCampaign.get(campaign.id) || []
    const goalProgressByPlatform = goalsForCampaign.map((goal) => {
      const actualPostsMonth =
        goal.platform === 'All'
          ? sumMapValues(monthlyPostsByPlatform)
          : Number(monthlyPostsByPlatform.get(goal.platform) || 0)

      const progress = computeGoalProgress({
        targetPerMonth: Number(goal.target_per_month || 0),
        actualPostsThisMonth: actualPostsMonth,
        daysElapsed,
        totalDaysInMonth,
      })

      return {
        platform: goal.platform,
        target_per_month: Number(goal.target_per_month || 0),
        actual_posts_month: actualPostsMonth,
        expected_pace: progress.expected_pace,
        progress_percent: progress.progress_percent,
        status: progress.status,
      }
    })

    const overallGoalStatus = goalProgressByPlatform.length
      ? goalProgressByPlatform.every((goal) => goal.status === 'not_started')
        ? 'not_started'
        : goalProgressByPlatform.some((goal) => goal.status === 'behind')
          ? 'behind'
          : 'on_track'
      : sumMapValues(monthlyPostsByPlatform) > 0
        ? 'on_track'
        : 'not_started'

    return {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      status: campaign.status,
      start_date: campaign.start_date,
      profile_urls: {
        tiktok_url: campaign.tiktok_url,
        instagram_url: campaign.instagram_url,
        youtube_url: campaign.youtube_url,
        facebook_url: campaign.facebook_url,
      },
      views_month: sumMapValues(monthlyViewsByPlatform),
      videos_month: sumMapValues(monthlyPostsByPlatform),
      total_views: sumMapValues(lifetimeViewsByPlatform),
      total_posts: sumMapValues(lifetimePostsByPlatform),
      lifetime_posts_by_platform: ED_PLATFORMS.map((platform) => ({
        platform,
        posts: Number(lifetimePostsByPlatform.get(platform) || 0),
      })),
      monthly_posts_by_platform: ED_PLATFORMS.map((platform) => ({
        platform,
        posts: Number(monthlyPostsByPlatform.get(platform) || 0),
      })),
      lifetime_views_by_platform: ED_PLATFORMS.map((platform) => ({
        platform,
        views: Number(lifetimeViewsByPlatform.get(platform) || 0),
      })),
      goal_progress_by_platform: goalProgressByPlatform,
      goal_status: overallGoalStatus,
    }
  })

  const monthRows = allRows.filter((post) => post.posted_at >= monthStartIso && post.posted_at < nextMonthStartIso)

  const totalViewsMonth = monthRows.reduce((sum, post) => sum + Number(post.views || 0), 0)
  const totalVideosMonth = monthRows.length
  const totalCampaigns = campaignRows.length
  const activeCampaigns = campaignRows.filter((campaign) => campaign.status === 'active').length

  const goalStatusCounts = campaignBreakdown.reduce(
    (acc, campaign) => {
      if (campaign.goal_status === 'behind') acc.behind += 1
      else if (campaign.goal_status === 'not_started') acc.not_started += 1
      else acc.on_track += 1
      return acc
    },
    { on_track: 0, behind: 0, not_started: 0 }
  )

  const platformBreakdown = Array.from(clientMonthlyViewsByPlatform.entries()).map(([platform, views]) => ({
    platform,
    views,
  }))

  return NextResponse.json({
    client,
    total_views_month: totalViewsMonth,
    total_videos_month: totalVideosMonth,
    total_campaigns: totalCampaigns,
    active_campaigns: activeCampaigns,
    top_post: null,
    campaign_breakdown: campaignBreakdown,
    platform_breakdown: platformBreakdown,
    goal_status_counts: goalStatusCounts,
  })
}
