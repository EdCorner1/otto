export const PORTFOLIO_VIDEO_BUCKET = 'videos'
export const DIRECT_VIDEO_PLATFORM = 'direct'

const IMAGE_EXTENSION_RE = /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i
const DIRECT_VIDEO_EXTENSION_RE = /\.(mp4|mov|webm|m4v)(\?|$)/i

function normalizePlatformValue(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, '-')
}

export function inferPortfolioType(url: string) {
  return IMAGE_EXTENSION_RE.test(url) ? 'image' : 'video'
}

export function extractYouTubeVideoId(url: string) {
  const trimmed = url.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function isYouTubeUrl(url: string) {
  return Boolean(extractYouTubeVideoId(url))
}

export function buildYouTubeEmbedUrl(url: string) {
  const videoId = extractYouTubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function isDirectVideoUrl(url: string) {
  const trimmed = url.trim()
  return trimmed.includes(`/storage/v1/object/public/${PORTFOLIO_VIDEO_BUCKET}/`) || DIRECT_VIDEO_EXTENSION_RE.test(trimmed)
}

export function detectPortfolioPlatform(url: string, preferredPlatform?: string | null) {
  const trimmed = url.trim().toLowerCase()

  if (isYouTubeUrl(trimmed)) return 'youtube'
  if (trimmed.includes('tiktok.com')) return 'tiktok'
  if (trimmed.includes('instagram.com')) return 'instagram'
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return 'youtube'
  if (isDirectVideoUrl(trimmed)) return DIRECT_VIDEO_PLATFORM

  const normalizedPreferred = normalizePlatformValue(preferredPlatform)
  return normalizedPreferred || DIRECT_VIDEO_PLATFORM
}

export function inferPortfolioThumbnail(url: string, platform?: string | null) {
  if (inferPortfolioType(url) === 'image') return url

  const resolvedPlatform = detectPortfolioPlatform(url, platform)
  if (resolvedPlatform === 'youtube') {
    const videoId = extractYouTubeVideoId(url)
    if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }

  return null
}

export function extractSupabasePublicPath(url: string, bucket: string) {
  const marker = `/storage/v1/object/public/${bucket}/`
  if (!url.includes(marker)) return null

  const [, rawPath = ''] = url.split(marker)
  const cleanPath = rawPath.split('?')[0]
  return cleanPath ? decodeURIComponent(cleanPath) : null
}

export function isManagedPortfolioVideoUrl(url: string) {
  return Boolean(extractSupabasePublicPath(url, PORTFOLIO_VIDEO_BUCKET))
}

export function formatVideoTitleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, '')
  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Untitled video'
}
