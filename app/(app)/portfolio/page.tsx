'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import MuxPlayer from '@mux/mux-player-react'
import {
  ArrowUpRight,
  Calendar,
  Circle,
  Clock3,
  LoaderCircle,
  Pencil,
  Play,
  Video,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { PublicCreatorPortfolio, PublicPortfolioSocial, PublicPortfolioVideo } from '@/lib/public-creator-portfolio'
import { buildCloudflareThumbnailUrl, extractCloudflareMediaId } from '@/lib/cloudflare-media'
import { inferPortfolioCategory, isCloudflareStreamUrl } from '@/lib/portfolio-media'

function formatCompactNumber(value: number) {
  if (!value) return '0'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent'
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
}

function formatResponseTime(hours: number | null) {
  if (!hours) return 'Replies in ~24 hours'
  if (hours < 24) return `Replies in ~${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.max(1, Math.round(hours / 24))
  return `Replies in ~${days} day${days === 1 ? '' : 's'}`
}

function platformLabel(platform: string) {
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'website') return 'Website'
  return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Portfolio'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'C'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
}

function getVideoTitle(item: PublicPortfolioVideo) {
  return item.caption?.trim() || `${platformLabel(item.platform)} portfolio sample`
}

function getYouTubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
}

function getVideoDisplayUrl(item: PublicPortfolioVideo) {
  if (item.kind === 'youtube' && item.youtubeId) return `https://youtu.be/${item.youtubeId}`
  return item.url
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

function readTag(tags: Array<{ tag: string | null }>, prefix: string) {
  return tags.find((item) => String(item.tag || '').startsWith(prefix))?.tag?.slice(prefix.length).trim() || ''
}

function parseYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] || ''
}

function buildPortfolioFromCreator(row: {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  availability: string | null
  creator_tags?: Array<{ tag: string | null }> | null
  creator_socials?: Array<{ platform: string | null; url: string | null }> | null
  portfolio_items?: Array<{
    id: string
    url: string | null
    platform: string | null
    caption: string | null
    thumbnail_url: string | null
    created_at: string
    sort_order: number | null
  }> | null
}): PublicCreatorPortfolio {
  const tags = row.creator_tags || []
  const handle = normalizeHandle(readTag(tags, 'handle:') || row.display_name || 'creator')
  const mainPlatform = readTag(tags, 'main_platform:')
  const followerRange = readTag(tags, 'followers:')
  const nicheTags = tags
    .map((item) => String(item.tag || ''))
    .filter((tag) => tag.startsWith('niche:'))
    .map((tag) => tag.slice('niche:'.length))
    .filter(Boolean)

  const socials = (row.creator_socials || [])
    .map((social) => ({ platform: String(social.platform || '').toLowerCase(), url: String(social.url || '') }))
    .filter((social) => social.platform && social.url)

  const portfolioItems = [...(row.portfolio_items || [])]
    .sort((a, b) => {
      const aSort = a.sort_order ?? 9999
      const bSort = b.sort_order ?? 9999
      if (aSort !== bSort) return aSort - bSort
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .map((item) => {
      const url = String(item.url || '').trim()
      const youtubeId = parseYoutubeId(url)
      const isYoutube = Boolean(youtubeId)
      const isCloudflare = !isYoutube && isCloudflareStreamUrl(url)
      const cloudflareId = isCloudflare ? extractCloudflareMediaId(url) || undefined : undefined
      const isMux = !isYoutube && !isCloudflare && !!url && !/^https?:\/\//i.test(url)
      const platform = String(item.platform || (isYoutube ? 'youtube' : isCloudflare ? 'cloudflare' : mainPlatform || 'portfolio')).toLowerCase()
      const thumbnailUrl = item.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : cloudflareId ? buildCloudflareThumbnailUrl(cloudflareId) : null)

      return {
        id: item.id,
        video_url: url,
        url,
        title: item.caption?.trim() || 'Untitled',
        platform,
        category: inferPortfolioCategory({ caption: item.caption, platform }),
        kind: isYoutube ? 'youtube' : isCloudflare ? 'cloudflare' : isMux ? 'mux' : 'direct',
        youtubeId: youtubeId || undefined,
        playbackId: isMux ? url : undefined,
        cloudflareId,
        cloudflareIframeUrl: cloudflareId ? `https://${process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_SUBDOMAIN || 'customer-hl0vh4j6c5g7f8bb'}.cloudflarestream.com/${cloudflareId}/iframe` : undefined,
        thumbnailUrl,
        caption: item.caption?.trim() || null,
        viewCount: 0,
        createdAt: item.created_at,
      }
    })

  const totalViews = portfolioItems.reduce((sum, item) => sum + item.viewCount, 0)
  const responseTimeHours = 24

  return {
    id: row.id,
    handle,
    fullName: row.display_name || handle,
    bio: row.bio || null,
    avatarUrl: row.avatar_url || null,
    userId: row.user_id,
    availability: row.availability || null,
    isAvailable: row.availability === 'open' || row.availability === 'available',
    location: null,
    tiktok_url: socials.find((social) => social.platform === 'tiktok')?.url || null,
    instagram_url: socials.find((social) => social.platform === 'instagram')?.url || null,
    youtube_url: socials.find((social) => social.platform === 'youtube')?.url || null,
    facebook_url: socials.find((social) => social.platform === 'facebook')?.url || null,
    niche_tags: nicheTags,
    nicheTags,
    main_platform: mainPlatform || null,
    mainPlatform: mainPlatform || undefined,
    follower_count: followerRange || null,
    socials,
    social_links: socials,
    portfolioItems,
    videos: portfolioItems,
    stats: {
      campaignsCompleted: 0,
      completedCampaigns: 0,
      videosDelivered: portfolioItems.length,
      totalVideos: portfolioItems.length,
      avgViews: portfolioItems.length ? Math.round(totalViews / portfolioItems.length) : 0,
      responseTime: formatResponseTime(responseTimeHours),
      responseTimeHours,
      onTimeRate: 100,
      onTimePercentage: 100,
    },
    isOwner: true,
  }
}

function platformIcon(platform: string, className = 'h-4 w-4') {
  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
      </svg>
    )
  }
  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M21 12.2c0 2.32-.27 4.01-.55 5.01a2.8 2.8 0 0 1-1.95 1.95c-1 .27-3.03.54-6.5.54s-5.5-.27-6.5-.54a2.8 2.8 0 0 1-1.95-1.95C3.27 16.21 3 14.52 3 12.2s.27-4.01.55-5.01A2.8 2.8 0 0 1 5.5 5.24c1-.27 3.03-.54 6.5-.54s5.5.27 6.5.54a2.8 2.8 0 0 1 1.95 1.95c.28 1 .55 2.69.55 5.01Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
      </svg>
    )
  }
  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.12v13.58a2.67 2.67 0 1 1-2.67-2.67c.23 0 .45.03.66.08V9.82a5.8 5.8 0 0 0-.66-.04A5.79 5.79 0 1 0 15.82 15V8.07a7.9 7.9 0 0 0 4.62 1.48V6.69h-.85Z" />
      </svg>
    )
  }
  if (platform === 'website') return <ArrowUpRight className={className} />
  return <Video className={className} />
}

function SocialLinksRow({ socials }: { socials: PublicPortfolioSocial[] }) {
  if (!socials.length) return null

  return (
    <div className="flex flex-wrap gap-3">
      {socials.map((social) => (
        <a
          key={`${social.platform}-${social.url}`}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#e7e7e0] bg-white px-4 py-2.5 text-sm font-medium text-[#363535] transition hover:-translate-y-0.5 hover:border-[#d0d0c8] hover:shadow-[0_14px_30px_rgba(0,0,0,0.05)]"
        >
          <span className="text-[#1c1c1e]">{platformIcon(social.platform)}</span>
          <span>{platformLabel(social.platform)}</span>
          <span className="text-[#8a8a84]">{social.label}</span>
        </a>
      ))}
    </div>
  )
}

function VideoThumbnail({ item }: { item: PublicPortfolioVideo }) {
  if (item.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.thumbnailUrl} alt={getVideoTitle(item)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#18181b_0%,#2a2a2f_100%)] text-white/80">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10">
          {platformIcon(item.platform, 'h-7 w-7')}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Portfolio video</p>
          <p className="mt-1 text-xs text-white/55">Preview available in player</p>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ item, onOpen }: { item: PublicPortfolioVideo; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[28px] border border-[#e8e8e4] bg-white text-left shadow-[0_18px_48px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_24px_56px_rgba(0,0,0,0.08)]"
      aria-label={`Open ${getVideoTitle(item)}`}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-[#111111]">
        <VideoThumbnail item={item} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/12 to-black/20" />

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#1c1c1e] shadow-sm">
          {platformIcon(item.platform, 'h-3.5 w-3.5')}
          <span>{platformLabel(item.platform)}</span>
        </div>

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#111111] shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition duration-200 group-hover:scale-105">
            <Play className="ml-1 h-6 w-6 fill-current" />
          </span>
        </span>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-[#1c1c1e]">{getVideoTitle(item)}</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6e6e67]">
          <span>{formatCompactNumber(item.viewCount)} views</span>
          <span className="text-[#c5c5bc]">•</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}

function VideoLightbox({ item, onClose }: { item: PublicPortfolioVideo; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#0f0f10] text-white shadow-[0_32px_120px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_340px]">
          <div className="bg-black">
            <div className="aspect-video w-full bg-black lg:min-h-[560px] lg:aspect-auto">
              {item.kind === 'youtube' && item.youtubeId ? (
                <iframe
                  title={getVideoTitle(item)}
                  src={getYouTubeEmbedUrl(item.youtubeId)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : item.kind === 'cloudflare' && item.cloudflareIframeUrl ? (
                <iframe
                  title={getVideoTitle(item)}
                  src={item.cloudflareIframeUrl}
                  className="h-full w-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : item.kind === 'mux' && item.playbackId ? (
                <MuxPlayer streamType="on-demand" playbackId={item.playbackId} autoPlay className="h-full w-full object-contain" />
              ) : (
                <video src={item.url} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 border-t border-white/10 p-6 lg:border-l lg:border-t-0">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                {platformIcon(item.platform, 'h-3.5 w-3.5')}
                <span>{platformLabel(item.platform)}</span>
              </div>

              <h3 className="mt-4 text-2xl leading-tight text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
                {getVideoTitle(item)}
              </h3>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(item.createdAt)}
                </span>
                <span>{formatCompactNumber(item.viewCount)} views</span>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={getVideoDisplayUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-5 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]"
              >
                Open original
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyPortfolioState() {
  return (
    <div className="rounded-[32px] border border-dashed border-[#d8d8d0] bg-[#fbfbf7] px-6 py-14 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <Video className="h-7 w-7 text-[#7ea400]" />
        </div>
        <h3 className="mt-5 text-2xl text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.03em' }}>
          No videos yet
        </h3>
        <p className="mt-3 text-base leading-7 text-[#6b6b6b]">
          Add portfolio videos to show brands your best work, editing style, and platform fit.
        </p>
        <div className="mt-8">
          <Link href="/profile/edit?tab=portfolio" className="btn-primary inline-flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit portfolio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function InternalPortfolioPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [portfolio, setPortfolio] = useState<PublicCreatorPortfolio | null>(null)
  const [activeVideo, setActiveVideo] = useState<PublicPortfolioVideo | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user

        if (!user) {
          window.location.href = '/login'
          return
        }

        const { data: creatorRow, error: creatorError } = await supabase
          .from('creators')
          .select('id, user_id, display_name, bio, avatar_url, availability, creator_tags(tag), creator_socials(platform, url), portfolio_items(id, url, platform, caption, thumbnail_url, created_at, sort_order)')
          .eq('user_id', user.id)
          .maybeSingle()

        if (creatorError || !creatorRow?.id) {
          throw new Error('No creator profile found yet. Complete onboarding first.')
        }

        if (!cancelled) {
          setPortfolio(buildPortfolioFromCreator(creatorRow))
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load your portfolio.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const topVideos = useMemo(() => {
    if (!portfolio) return []
    return [...portfolio.portfolioItems]
      .sort((a, b) => {
        if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .slice(0, 3)
  }, [portfolio])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-[#e8e8e4] bg-white px-5 py-3 text-sm font-medium text-[#1c1c1e] shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading your portfolio…
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-8 md:px-6">
        <div className="rounded-[28px] border border-[#e8e8e4] bg-white p-8 text-center shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
          <h1 className="text-2xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
            Portfolio unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">{error || 'Could not load your portfolio.'}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/profile/edit" className="btn-primary">Edit profile</Link>
            <Link href="/dashboard" className="btn-ghost">Back to dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const responseTimeLabel = formatResponseTime(portfolio.stats.responseTimeHours)
  const availabilityText = portfolio.isAvailable ? 'Available now' : 'Busy right now'

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-8 md:px-6">
        <section className="overflow-hidden rounded-[36px] border border-[#ecece5] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-12">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Creator portfolio</p>
                  <h1 className="mt-2 text-[clamp(2rem,6vw,3.75rem)] leading-[0.94] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.06em' }}>
                    What brands see
                  </h1>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/profile/edit?tab=portfolio" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9d9d2] bg-white px-5 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:-translate-y-0.5 hover:border-[#c7c7bf]">
                    <Pencil className="h-4 w-4" />
                    Edit portfolio
                  </Link>
                  <Link href={`/${portfolio.handle}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black">
                    View public profile
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                {portfolio.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={portfolio.avatarUrl}
                    alt={portfolio.fullName}
                    className="h-32 w-32 rounded-[32px] border border-[#e7e7df] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:h-36 sm:w-36"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-[32px] border border-dashed border-[#d7d7cf] bg-[#f3f3ee] text-3xl font-semibold text-[#7b7b74] sm:h-36 sm:w-36">
                    {getInitials(portfolio.fullName)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Creator profile</p>
                      <h2
                        className="mt-2 text-[clamp(2.1rem,7vw,4.4rem)] leading-[0.92] text-[#111111]"
                        style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.06em' }}
                      >
                        {portfolio.fullName}
                      </h2>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${portfolio.isAvailable ? 'bg-[#efffd3] text-[#355400]' : 'bg-[#f3f3ef] text-[#64645d]'}`}>
                      <Circle className={`h-2.5 w-2.5 fill-current ${portfolio.isAvailable ? 'text-[#98d800]' : 'text-[#a3a39b]'}`} />
                      {availabilityText}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#6d6d66]">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f6f2] px-3 py-1.5 text-[#4f4f49]">
                      @{portfolio.handle}
                    </span>
                    <Link href={`/${portfolio.handle}`} className="inline-flex items-center gap-1.5 font-medium text-[#1c1c1e] transition hover:text-[#6b6b6b]">
                      View public profile
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {portfolio.bio && (
                    <div className="mt-8 max-w-3xl">
                      <p className="line-clamp-3 text-lg leading-8 text-[#4f4f49]">{portfolio.bio}</p>
                    </div>
                  )}

                  {portfolio.nicheTags.length > 0 && (
                    <div className="mt-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Niches</p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {portfolio.nicheTags.map((tag) => (
                          <span key={tag} className="rounded-full border border-[#e7e7df] bg-[#fafaf7] px-3.5 py-2 text-sm font-medium text-[#4c4c46]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {portfolio.socials.length > 0 && (
                    <div className="mt-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Social links</p>
                      <div className="mt-3">
                        <SocialLinksRow socials={portfolio.socials.filter((social) => ['tiktok', 'instagram', 'youtube'].includes(social.platform))} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="border-t border-[#ecece5] bg-[#fafaf7] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="rounded-[28px] bg-[#111111] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">At a glance</p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-sm text-white/65">Main platform</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-white">
                      {platformIcon(portfolio.mainPlatform ?? '')}
                      {platformLabel(portfolio.mainPlatform ?? '')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">Portfolio status</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {portfolio.stats.totalVideos} video{portfolio.stats.totalVideos === 1 ? '' : 's'} ready to review
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">Response time</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-white">
                      <Clock3 className="h-4 w-4 text-[#ccff00]" />
                      {responseTimeLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-[#e8e8e1] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Stats</p>
                <dl className="mt-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-[#6c6c66]">Campaigns completed</dt>
                    <dd className="text-lg font-semibold text-[#1c1c1e]">{portfolio.stats.completedCampaigns}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-[#6c6c66]">Videos delivered</dt>
                    <dd className="text-lg font-semibold text-[#1c1c1e]">{portfolio.stats.videosDelivered}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-[#6c6c66]">Average views</dt>
                    <dd className="text-lg font-semibold text-[#1c1c1e]">{formatCompactNumber(portfolio.stats.avgViews)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-[#6c6c66]">Response time</dt>
                    <dd className="text-lg font-semibold text-[#1c1c1e]">{portfolio.stats.responseTimeHours ? `${portfolio.stats.responseTimeHours}h` : '—'}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Best performing</p>
              <h2 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                Top videos
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#6d6d66]">
              Ranked automatically using portfolio view counts so you can see what a brand sees first.
            </p>
          </div>

          {topVideos.length === 0 ? (
            <EmptyPortfolioState />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {topVideos.map((item) => (
                <VideoCard key={`top-${item.id}`} item={item} onOpen={() => setActiveVideo(item)} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Portfolio</p>
              <h2 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                All videos
              </h2>
              <p className="mt-2 text-sm text-[#6d6d66]">
                {portfolio.portfolioItems.length} video{portfolio.portfolioItems.length === 1 ? '' : 's'}
              </p>
            </div>
            {portfolio.portfolioItems.length > 0 && (
              <p className="max-w-xl text-sm leading-6 text-[#6d6d66]">
                Selected work designed to show style, edit quality, and platform fit at a glance.
              </p>
            )}
          </div>

          {portfolio.portfolioItems.length === 0 ? (
            <EmptyPortfolioState />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {portfolio.portfolioItems.map((item) => (
                <VideoCard key={item.id} item={item} onOpen={() => setActiveVideo(item)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {activeVideo && <VideoLightbox item={activeVideo} onClose={() => setActiveVideo(null)} />}
    </>
  )
}
