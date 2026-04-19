import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CreatorProfile {
  id: string
  handle: string
  avatar_url: string | null
  bio: string | null
  niche_tags: string[]
  social_links: {
    platform: string
    url: string
    label?: string
  }[]
  main_platform: string | null
  follower_count: string | null
  availability: string | null
}

interface PortfolioStats {
  campaignsCompleted: number
  videosDelivered: number
  avgViews: number
  responseTime: string
  onTimeRate: number
}

interface PortfolioItem {
  id: string
  video_url: string
  title: string
  platform: string
  views: number
  created_at: string
  thumbnail_url: string | null
}

interface PublicCreatorPortfolio {
  profile: CreatorProfile
  stats: PortfolioStats
  portfolio: PortfolioItem[]
  isOwner: boolean
}

export async function getPublicCreatorPortfolioByHandle(
  handle: string,
  currentUserId?: string
): Promise<PublicCreatorPortfolio | null> {
  // Fetch creator by handle
  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .ilike('handle', handle)
    .single()

  if (error || !creator) return null

  // Fetch portfolio items
  const { data: items } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Compute stats (placeholder for now — can be enhanced with actual deal/content data)
  const stats: PortfolioStats = {
    campaignsCompleted: 0,
    videosDelivered: items?.length || 0,
    avgViews: items && items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + (i.views || 0), 0) / items.length)
      : 0,
    responseTime: '~2 hours',
    onTimeRate: 100,
  }

  const socialLinks = []
  if (creator.tiktok_url) socialLinks.push({ platform: 'TikTok', url: creator.tiktok_url })
  if (creator.instagram_url) socialLinks.push({ platform: 'Instagram', url: creator.instagram_url })
  if (creator.youtube_url) socialLinks.push({ platform: 'YouTube', url: creator.youtube_url })
  if (creator.facebook_url) socialLinks.push({ platform: 'Facebook', url: creator.facebook_url })

  const profile: CreatorProfile = {
    id: creator.id,
    handle: creator.handle,
    avatar_url: creator.avatar_url,
    bio: creator.bio || null,
    niche_tags: creator.niche_tags || [],
    social_links: socialLinks,
    main_platform: creator.main_platform || null,
    follower_count: creator.follower_count || null,
    availability: creator.availability || null,
  }

  return {
    profile,
    stats,
    portfolio: items?.map(i => ({
      id: i.id,
      video_url: i.video_url,
      title: i.title || 'Untitled',
      platform: i.platform || 'direct',
      views: i.views || 0,
      created_at: i.created_at,
      thumbnail_url: i.thumbnail_url || null,
    })) || [],
    isOwner: currentUserId === creator.user_id,
  }
}