export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!
export const CLOUDFLARE_STREAM_ZONE = process.env.CLOUDFLARE_STREAM_ZONE || 'stream'

/**
 * Build a Cloudflare Stream playback URL from a media ID.
 * The media ID is returned by the Cloudflare Stream API after upload.
 */
export function buildCloudflareStreamUrl(mediaId: string): string {
  return `https://customer-hl0vh4j6c5g7f8bb.playback.live-video.net/video/${mediaId}`
}

/**
 * Extract the Cloudflare media ID from a full playback URL.
 * If already just an ID, returns it as-is.
 */
export function extractCloudflareMediaId(url: string): string | null {
  if (!url) return null
  // Already just an ID
  if (/^[a-f0-9]{32}$/i.test(url)) return url
  // Cloudflare Stream playback URL
  const match = url.match(/\/video\/([a-f0-9]{32})/i)
  if (match) return match[1]
  return null
}

/**
 * Build a thumbnail URL from a Cloudflare media ID.
 */
export function buildCloudflareThumbnailUrl(mediaId: string): string {
  return `https://customer-hl0vh4j6c5g7f8bb.cloudflarestream.com/${mediaId}/thumb.jpg`
}

/**
 * Detect if a URL is a Cloudflare Stream URL.
 */
export function isCloudflareStreamUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.includes('cloudflarestream.com') ||
    lower.includes('playback.live-video.net') ||
    lower.includes('videodelivery.net')
  )
}

/**
 * Infer platform from Cloudflare URL context.
 */
export function detectCloudflarePlatform(_url: string): string {
  return 'Cloudflare'
}
