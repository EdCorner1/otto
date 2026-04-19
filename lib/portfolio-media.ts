// Constants
export const DIRECT_VIDEO_PLATFORM = 'direct'
export const MAX_PORTFOLIO_VIDEOS = 6
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024 // 100MB

// Platform detection
export function detectPortfolioPlatform(url: string): string {
  if (!url) return DIRECT_VIDEO_PLATFORM
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('tiktok.com')) return 'TikTok'
  if (lower.includes('instagram.com') || lower.includes('ig.me')) return 'Instagram'
  if (lower.includes('vimeo.com')) return 'Vimeo'
  return DIRECT_VIDEO_PLATFORM
}

// YouTube embed URL builder
export function buildYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  const shortsMatch = url.match(/ shorts\/([a-zA-Z0-9_-]{11})/)
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

// Managed portfolio URL check (Supabase Storage)
export function isManagedPortfolioVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('supabase.co') || lower.includes('vcoeayvzuranirnxavwn.supabase.co')
}

// Thumbnail inference for direct upload videos
export async function inferPortfolioThumbnail(videoUrl: string, _platformHint?: string): Promise<string | null> {
  // For Supabase Storage URLs, we can't auto-generate a thumbnail without a video processing service
  // Return a placeholder gradient based on the URL hash as a fallback
  if (isManagedPortfolioVideoUrl(videoUrl)) {
    return null // Will use placeholder
  }
  return null
}

// Infer content type from URL or extension
export function inferPortfolioType(url: string): 'video' | 'link' {
  if (!url) return 'link'
  if (isDirectVideoUrl(url) || url.match(/\.(mp4|mov|webm|avi|mkv)$/i)) return 'video'
  return 'link'
}

// Accept video mime types for upload
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
export function isValidVideoMimeType(mime: string): boolean {
  return VIDEO_MIME_TYPES.includes(mime)
}