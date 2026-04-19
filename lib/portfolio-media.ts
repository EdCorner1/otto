// Constants
export const DIRECT_VIDEO_PLATFORM = 'direct'
export const MAX_PORTFOLIO_VIDEOS = 6
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024 // 100MB
export const PORTFOLIO_VIDEO_BUCKET = 'portfolio-videos'

// Platform detection (url + optional platform hint for disambiguation)
export function detectPortfolioPlatform(url: string, _platformHint?: string | null): string {
  if (!url) return DIRECT_VIDEO_PLATFORM
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('tiktok.com')) return 'TikTok'
  if (lower.includes('instagram.com') || lower.includes('ig.me')) return 'Instagram'
  if (lower.includes('vimeo.com')) return 'Vimeo'
  if (lower.includes('cloudflarestream.com') || lower.includes('playback.live-video.net')) return 'Cloudflare'
  if (lower.includes('supabase.co') || lower.includes('vcoeayvzuranirnxavwn.supabase.co')) return 'Direct'
  return DIRECT_VIDEO_PLATFORM
}

// YouTube embed URL builder
export function buildYouTubeEmbedUrl(url: string, _platformHint?: string | null): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`
  if (url.includes('youtube.com/embed/')) return url
  return ''
}

// Direct video URL check
export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return false
  if (lower.includes('tiktok.com') || lower.includes('instagram.com') || lower.includes('vimeo.com')) return false
  return true
}

// Managed portfolio URL check (Supabase Storage or Cloudflare Stream)
export function isManagedPortfolioVideoUrl(url: string, _platformHint?: string | null): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.includes('supabase.co') ||
    lower.includes('vcoeayvzuranirnxavwn.supabase.co') ||
    lower.includes('cloudflarestream.com') ||
    lower.includes('playback.live-video.net') ||
    lower.includes('videodelivery.net')
  )
}

// Thumbnail inference — returns null (caller should fall back to placeholder)
export function inferPortfolioThumbnail(videoUrl: string, _platformHint?: string | null): string | null {
  if (isManagedPortfolioVideoUrl(videoUrl)) return null
  return null
}

// Infer content type from URL or extension
export function inferPortfolioType(url: string, _platformHint?: string | null): 'video' | 'link' {
  if (!url) return 'link'
  if (isDirectVideoUrl(url) || url.match(/\.(mp4|mov|webm|avi|mkv)$/i)) return 'video'
  return 'link'
}

// Accept video mime types for upload
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
export function isValidVideoMimeType(mime: string): boolean {
  return VIDEO_MIME_TYPES.includes(mime)
}

// Format filename into a readable title
export function formatVideoTitleFromFilename(filename: string): string {
  const name = filename.replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, '')
  return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Extract the Supabase Storage public path from a full URL
export function extractSupabasePublicPath(url: string, _bucket?: string): string | null {
  const match = url.match(/portfolio-videos\/(.+)$/)
  return match ? match[1] : null
}
