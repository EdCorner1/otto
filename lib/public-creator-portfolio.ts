import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Shared types ────────────────────────────────────────────────────────────

export interface PublicPortfolioSocial {
  platform: string
  url: string
  label?: string
}

export interface PublicPortfolioVideo {
  id: string
  video_url: string
  url: string
  title: string
  platform: string
  kind: string
  youtubeId?: string
  playbackId?: string
  thumbnailUrl: string | null
  caption: string | null
  viewCount: number
  createdAt: string
}

export interface PublicCreatorPortfolio {
  // Flat fields
  id: string
  handle: string
  fullName: string
  bio: string | null
  avatarUrl: string | null
  userId: string
  availability: string | null
  isAvailable: boolean
  location: string | null
  tiktok_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  facebook_url: string | null
  niche_tags: string[]
  nicheTags: string[]
  main_platform: string | null
  mainPlatform: string | null
  follower_count: string | null
  // Nested structures
  socials: PublicPortfolioSocial[]
  social_links: PublicPortfolioSocial[]
  portfolioItems: PublicPortfolioVideo[]
  videos: PublicPortfolioVideo[]
  stats: {
    campaignsCompleted: number
    completedCampaigns: number
    videosDelivered: number
    totalVideos: number
    avgViews: number
    responseTime: string
    responseTimeHours: number | null
    onTimeRate: number
    onTimePercentage: number | null
  }
  isOwner: boolean
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function normalizeHandle(handle: string) {
  return handle.startsWith('@') ? handle.slice(1) : handle
}

// ─── Main query ────────────────────────────────────────────────────────────────

export async function getPublicCreatorPortfolioByHandle(
  handle: string,
  currentUserId?: string
): Promise<PublicCreatorPortfolio | null> {
  const normalizedHandle = normalizeHandle(handle)

  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .ilike('handle', normalizedHandle)
    .single()

  if (error || !creator) return null

  const { data: items } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const videos: PublicPortfolioVideo[] = (items || []).map(i => {
    const url = i.video_url || i.url || ''
    const platform = i.platform || ''
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be')
    const isMux = !isYoutube && !url.includes('http')
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return {
      id: i.id,
      video_url: url,
      url,
      title: i.title || 'Untitled',
      platform,
      kind: isYoutube ? 'youtube' : isMux ? 'mux' : 'direct',
      youtubeId: ytMatch ? ytMatch[1] : undefined,
      playbackId: isMux ? url : undefined,
      thumbnailUrl: i.thumbnail_url || null,
      caption: (i.caption || i.title) as string | null,
      viewCount: i.views || 0,
      createdAt: i.created_at,
    }
  })

  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
  const totalVideos = videos.length

  const socials: PublicPortfolioSocial[] = []
  if (creator.tiktok_url) socials.push({ platform: 'TikTok', url: creator.tiktok_url })
  if (creator.instagram_url) socials.push({ platform: 'Instagram', url: creator.instagram_url })
  if (creator.youtube_url) socials.push({ platform: 'YouTube', url: creator.youtube_url })
  if (creator.facebook_url) socials.push({ platform: 'Facebook', url: creator.facebook_url })

  const availability = creator.availability || null
  const isAvailable = availability === 'available'

  return {
    id: creator.id,
    handle: creator.handle,
    fullName: creator.full_name || creator.handle,
    bio: creator.bio || null,
    avatarUrl: creator.avatar_url || null,
    userId: creator.user_id,
    availability,
    isAvailable,
    location: null,
    tiktok_url: creator.tiktok_url || null,
    instagram_url: creator.instagram_url || null,
    youtube_url: creator.youtube_url || null,
    facebook_url: creator.facebook_url || null,
    niche_tags: creator.niche_tags || [],
    nicheTags: creator.niche_tags || [],
    main_platform: creator.main_platform || undefined,
    mainPlatform: creator.main_platform || undefined,
    follower_count: creator.follower_count || null,
    socials,
    social_links: socials,
    portfolioItems: videos,
    videos,
    stats: {
      campaignsCompleted: 0,
      completedCampaigns: 0,
      videosDelivered: totalVideos,
      totalVideos,
      avgViews: totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0,
      responseTime: '~2 hours',
      responseTimeHours: 2,
      onTimeRate: 100,
      onTimePercentage: null,
    },
    isOwner: currentUserId === creator.user_id,
  }
}
