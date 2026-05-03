import { createClient } from '@supabase/supabase-js'
import { inferPortfolioCategory, isCloudflareStreamUrl, type PortfolioCategory } from '@/lib/portfolio-media'
import { extractCloudflareMediaId, buildCloudflareThumbnailUrl } from '@/lib/cloudflare-media'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface PublicPortfolioSocial {
  platform: string
  url: string
  label?: string
}

export interface PublicPortfolioReview {
  quote: string
  reviewerName: string
  reviewerTitle: string | null
}

export interface PublicFeaturedWork {
  label: string
  metric: string | null
  title: string
  note: string | null
  video?: PublicPortfolioVideo | null
}

export interface PublicPortfolioVideo {
  id: string
  video_url: string
  url: string
  title: string
  platform: string
  category: PortfolioCategory
  kind: string
  youtubeId?: string
  playbackId?: string
  cloudflareId?: string
  cloudflareIframeUrl?: string
  thumbnailUrl: string | null
  caption: string | null
  viewCount: number
  createdAt: string
}

export interface PublicCreatorPortfolio {
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
  mainPlatform?: string
  follower_count: string | null
  socials: PublicPortfolioSocial[]
  social_links: PublicPortfolioSocial[]
  brandLogos?: string[]
  introVideo?: PublicPortfolioVideo | null
  reviews?: PublicPortfolioReview[]
  featuredWork?: PublicFeaturedWork[]
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

type CreatorTagRow = { tag: string }
type CreatorSocialRow = { platform: string; url: string }
type CreatorRow = {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  availability: string | null
  creator_tags?: CreatorTagRow[] | null
  creator_socials?: CreatorSocialRow[] | null
}

type PortfolioItemRow = {
  id: string
  url: string | null
  video_url?: string | null
  title?: string | null
  type?: string | null
  platform?: string | null
  category?: string | null
  caption?: string | null
  thumbnail_url?: string | null
  created_at: string
  sort_order?: number | null
  views?: number | null
}

function normalizeHandle(handle: string) {
  return handle.trim().replace(/^@+/, '').toLowerCase()
}

function normalizePlatform(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function parseCreatorMeta(tags: CreatorTagRow[]) {
  const read = (prefix: string) => tags.find((t) => t.tag.startsWith(prefix))?.tag.replace(prefix, '').trim() || ''

  return {
    handle: read('handle:'),
    mainPlatform: normalizePlatform(read('main_platform:')),
    followerRange: read('followers:'),
    incomeRange: read('income:'),
    nicheTags: tags
      .filter((t) => t.tag.startsWith('niche:'))
      .map((t) => t.tag.replace('niche:', '').trim())
      .filter(Boolean),
    introVideoUrl: read('intro_video:'),
    reviews: tags
      .filter((t) => t.tag.startsWith('review:'))
      .map((t) => {
        const parts = t.tag.replace('review:', '').split('|').map((part) => part.trim())
        return { quote: parts[0] || '', reviewerName: parts[1] || 'Brand partner', reviewerTitle: parts[2] || null }
      })
      .filter((review) => review.quote),
    featuredWork: tags
      .filter((t) => t.tag.startsWith('featured:'))
      .map((t) => {
        const parts = t.tag.replace('featured:', '').split('|').map((part) => part.trim())
        if (parts.length >= 4) {
          return { label: parts[0] || 'Featured', metric: parts[1] || null, title: parts[2] || '', note: parts[3] || null }
        }
        return { label: parts[0] || 'Featured', metric: null, title: parts[1] || '', note: parts[2] || null }
      })
      .filter((item) => item.title),
  }
}

function inferPlatformFromUrl(url: string) {
  const normalized = url.toLowerCase()
  if (normalized.includes('tiktok.com')) return 'tiktok'
  if (normalized.includes('instagram.com')) return 'instagram'
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube'
  if (normalized.includes('facebook.com')) return 'facebook'
  return ''
}

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1]
}

function inferThumbnail(url: string, platform: string, explicitThumbnail: string | null | undefined) {
  if (explicitThumbnail) return explicitThumbnail
  if (platform === 'youtube') {
    const youtubeId = getYoutubeId(url)
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
  }
  if (platform === 'cloudflare' || isCloudflareStreamUrl(url)) {
    const mediaId = extractCloudflareMediaId(url)
    if (mediaId) return buildCloudflareThumbnailUrl(mediaId)
  }
  return null
}

async function findCreatorIdByHandle(normalizedHandle: string) {
  const tagValue = `handle:${normalizedHandle}`

  const { data: tagRow } = await supabase
    .from('creator_tags')
    .select('creator_id')
    .eq('tag', tagValue)
    .maybeSingle()

  if (tagRow?.creator_id) return tagRow.creator_id as string

  const { data: legacyCreator } = await supabase
    .from('creators')
    .select('id')
    .ilike('handle', normalizedHandle)
    .maybeSingle()

  return (legacyCreator?.id as string | undefined) || null
}

export async function getPublicCreatorPortfolioByHandle(
  handle: string,
  currentUserId?: string
): Promise<PublicCreatorPortfolio | null> {
  const normalizedHandle = normalizeHandle(handle)
  if (!normalizedHandle) return null

  const creatorId = await findCreatorIdByHandle(normalizedHandle)
  if (!creatorId) return null

  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id, user_id, display_name, bio, avatar_url, availability, creator_tags(tag), creator_socials(platform, url)')
    .eq('id', creatorId)
    .single()

  if (creatorError || !creator) return null

  const { data: items } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(24)

  const creatorRow = creator as CreatorRow
  const tags = (creatorRow.creator_tags || []) as CreatorTagRow[]
  const socialsRaw = (creatorRow.creator_socials || []) as CreatorSocialRow[]
  const meta = parseCreatorMeta(tags)

  const brandLogos = tags
    .map((item) => item.tag || '')
    .filter((tag) => tag.startsWith('brand:'))
    .map((tag) => tag.slice('brand:'.length).trim())
    .filter(Boolean)

  const socials: PublicPortfolioSocial[] = socialsRaw
    .map((social) => ({
      platform: normalizePlatform(social.platform),
      url: social.url,
    }))
    .filter((social) => social.platform && social.url)

  const buildPublicVideo = (item: PortfolioItemRow, fallbackId: string): PublicPortfolioVideo => {
    const url = String(item.video_url || item.url || '').trim()
    const platform = normalizePlatform(item.platform) || inferPlatformFromUrl(url) || meta.mainPlatform || 'portfolio'
    const youtubeId = getYoutubeId(url)
    const isYoutube = Boolean(youtubeId)
    const isCloudflare = !isYoutube && isCloudflareStreamUrl(url)
    const cloudflareId = isCloudflare ? extractCloudflareMediaId(url) || undefined : undefined
    const isMux = !isYoutube && !isCloudflare && !!url && !/^https?:\/\//i.test(url)

    return {
      id: item.id || fallbackId,
      video_url: url,
      url,
      title: item.title?.trim() || item.caption?.trim() || 'Untitled',
      platform,
      category: inferPortfolioCategory({ caption: item.caption, platform, category: item.category }),
      kind: isYoutube ? 'youtube' : isCloudflare ? 'cloudflare' : isMux ? 'mux' : 'direct',
      youtubeId: youtubeId || undefined,
      playbackId: isMux ? url : undefined,
      cloudflareId,
      cloudflareIframeUrl: cloudflareId ? `https://${process.env.CLOUDFLARE_STREAM_SUBDOMAIN || 'customer-ptaqr8qc63pdtfzg'}.cloudflarestream.com/${cloudflareId}/iframe` : undefined,
      thumbnailUrl: inferThumbnail(url, platform, item.thumbnail_url),
      caption: item.caption?.trim() || item.title?.trim() || null,
      viewCount: typeof item.views === 'number' ? item.views : 0,
      createdAt: item.created_at,
    }
  }

  const videos: PublicPortfolioVideo[] = ((items || []) as PortfolioItemRow[]).map((item) => buildPublicVideo(item, item.id))

  const introVideo = meta.introVideoUrl
    ? buildPublicVideo({
        id: `intro-${creatorRow.id}`,
        url: meta.introVideoUrl,
        video_url: meta.introVideoUrl,
        title: 'Intro video',
        platform: inferPlatformFromUrl(meta.introVideoUrl) || meta.mainPlatform || 'portfolio',
        category: 'Tech & Apps',
        caption: `Meet ${creatorRow.display_name?.trim() || meta.handle || normalizedHandle}`,
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        sort_order: -1,
        views: 0,
      }, `intro-${creatorRow.id}`)
    : null

  const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0)
  const totalVideos = videos.length

  const socialUrl = (platform: string) => socials.find((social) => social.platform === platform)?.url || null
  const availability = creatorRow.availability || null
  const isAvailable = availability === 'open' || availability === 'available'
  const fullName = creatorRow.display_name?.trim() || meta.handle || normalizedHandle

  return {
    id: creatorRow.id,
    handle: meta.handle || normalizedHandle,
    fullName,
    bio: creatorRow.bio || null,
    avatarUrl: creatorRow.avatar_url || null,
    userId: creatorRow.user_id,
    availability,
    isAvailable,
    location: null,
    tiktok_url: socialUrl('tiktok'),
    instagram_url: socialUrl('instagram'),
    youtube_url: socialUrl('youtube'),
    facebook_url: socialUrl('facebook'),
    niche_tags: meta.nicheTags,
    nicheTags: meta.nicheTags,
    main_platform: meta.mainPlatform || null,
    mainPlatform: meta.mainPlatform || undefined,
    follower_count: meta.followerRange || null,
    socials,
    social_links: socials,
    brandLogos,
    introVideo,
    reviews: meta.reviews,
    featuredWork: meta.featuredWork.map((item, index) => ({ ...item, video: videos[index] || null })),
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
    isOwner: currentUserId === creatorRow.user_id,
  }
}
