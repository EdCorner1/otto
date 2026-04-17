import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext, toMonthStartIso } from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

type CampaignRow = {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
}

type PostRow = {
  id: string
  campaign_id: string
  platform: 'TikTok' | 'Instagram' | 'YouTube'
  views: number | null
  likes: number | null
  video_url: string
  posted_at: string
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  const monthStartIso = toMonthStartIso()

  const [{ data: client }, { data: campaigns, error: campaignsError }] = await Promise.all([
    auth.admin.from('clients').select('id, name, brand_color, logo_url').eq('id', id).maybeSingle(),
    auth.admin.from('campaigns').select('id, name, status').eq('client_id', id),
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
    })
  }

  const [{ data: postsAll, error: postsAllError }, { data: postsMonth, error: postsMonthError }] = await Promise.all([
    auth.admin
      .from('campaign_posts')
      .select('id, campaign_id, platform, views, likes, video_url, posted_at')
      .in('campaign_id', campaignIds),
    auth.admin
      .from('campaign_posts')
      .select('id, campaign_id, platform, views, likes, video_url, posted_at')
      .in('campaign_id', campaignIds)
      .gte('posted_at', monthStartIso),
  ])

  if (postsAllError) return NextResponse.json({ error: postsAllError.message }, { status: 500 })
  if (postsMonthError) return NextResponse.json({ error: postsMonthError.message }, { status: 500 })

  const allRows = (postsAll || []) as PostRow[]
  const monthRows = (postsMonth || []) as PostRow[]

  const totalViewsMonth = monthRows.reduce((sum, post) => sum + Number(post.views || 0), 0)
  const totalVideosMonth = monthRows.length
  const totalCampaigns = campaignRows.length
  const activeCampaigns = campaignRows.filter((campaign) => campaign.status === 'active').length

  const topPost = allRows
    .slice()
    .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))[0] || null

  const campaignMonthRollup = monthRows.reduce<Record<string, { views_month: number; videos_month: number }>>((acc, post) => {
    const existing = acc[post.campaign_id] || { views_month: 0, videos_month: 0 }
    existing.views_month += Number(post.views || 0)
    existing.videos_month += 1
    acc[post.campaign_id] = existing
    return acc
  }, {})

  const campaignAllRollup = allRows.reduce<Record<string, { total_views: number; total_posts: number }>>((acc, post) => {
    const existing = acc[post.campaign_id] || { total_views: 0, total_posts: 0 }
    existing.total_views += Number(post.views || 0)
    existing.total_posts += 1
    acc[post.campaign_id] = existing
    return acc
  }, {})

  const campaignBreakdown = campaignRows.map((campaign) => ({
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    status: campaign.status,
    views_month: campaignMonthRollup[campaign.id]?.views_month || 0,
    videos_month: campaignMonthRollup[campaign.id]?.videos_month || 0,
    total_views: campaignAllRollup[campaign.id]?.total_views || 0,
    total_posts: campaignAllRollup[campaign.id]?.total_posts || 0,
  }))

  const platformBreakdownMap = monthRows.reduce<Record<string, number>>((acc, post) => {
    const platform = post.platform || 'Unknown'
    acc[platform] = (acc[platform] || 0) + Number(post.views || 0)
    return acc
  }, {})

  const platformBreakdown = Object.entries(platformBreakdownMap).map(([platform, views]) => ({
    platform,
    views,
  }))

  return NextResponse.json({
    client,
    total_views_month: totalViewsMonth,
    total_videos_month: totalVideosMonth,
    total_campaigns: totalCampaigns,
    active_campaigns: activeCampaigns,
    top_post: topPost,
    campaign_breakdown: campaignBreakdown,
    platform_breakdown: platformBreakdown,
  })
}
