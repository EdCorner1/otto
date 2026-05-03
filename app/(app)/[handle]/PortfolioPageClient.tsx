'use client'

import { useEffect, useMemo, useState } from 'react'
import { PORTFOLIO_CATEGORIES, normalizePortfolioCategory } from '@/lib/portfolio-media'
import Link from 'next/link'
import MuxPlayer from '@mux/mux-player-react'
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Circle,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Play,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import type { PublicCreatorPortfolio, PublicPortfolioSocial, PublicPortfolioVideo } from '@/lib/public-creator-portfolio'

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

function getFirstName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean)[0] || name
}

function getContactEmail(portfolio: PublicCreatorPortfolio) {
  const websiteSocial = portfolio.socials.find((social) => social.platform === 'website')
  if (websiteSocial?.url.startsWith('mailto:')) {
    return websiteSocial.url.replace(/^mailto:/i, '')
  }
  return null
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

function getVideoTitle(item: PublicPortfolioVideo) {
  return item.caption?.trim() || `${platformLabel(item.platform)} portfolio sample`
}

function getVideoSubtitle(item: PublicPortfolioVideo) {
  return `${formatCompactNumber(item.viewCount)} views • ${formatDate(item.createdAt)}`
}

function getYouTubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
}

function getVideoDisplayUrl(item: PublicPortfolioVideo) {
  if (item.kind === 'youtube' && item.youtubeId) return `https://youtu.be/${item.youtubeId}`
  return item.url
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

function socialButtonClass(platform: string) {
  if (platform === 'tiktok') return 'border-[#111111] bg-[#111111] text-white hover:bg-black'
  if (platform === 'instagram') return 'border-[#f1d4e6] bg-[#fff4fb] text-[#8a255f] hover:border-[#e7bdd9]'
  if (platform === 'youtube') return 'border-[#ffd6d6] bg-[#fff5f5] text-[#b42323] hover:border-[#ffbcbc]'
  return 'border-[#e1e1da] bg-white text-[#363535] hover:border-[#cfcfc7]'
}

function BrandLogoMark({ label }: { label: string }) {
  return (
    <div className="mx-8 flex shrink-0 items-center justify-center whitespace-nowrap text-[clamp(1.6rem,3vw,2.6rem)] font-semibold tracking-[-0.055em] text-[#22221f]/55 transition hover:text-[#22221f] sm:mx-10">
      {label}
    </div>
  )
}

function ReviewCard({ review, featured = false }: { review: NonNullable<PublicCreatorPortfolio['reviews']>[number]; featured?: boolean }) {
  return (
    <div className={`mx-3 shrink-0 rounded-[28px] border border-[#e7e7df] bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] ${featured ? 'w-[330px] sm:w-[420px]' : 'w-[280px] opacity-70 sm:w-[340px]'}`}>
      <div className="mb-4 tracking-[0.16em] text-[#d8a441]">★★★★★</div>
      <p className={`leading-7 text-[#44443f] ${featured ? 'text-base' : 'text-sm'}`}>“{review.quote}”</p>
      <div className="mt-6 border-t border-[#eeeeea] pt-4">
        <p className="text-sm font-semibold text-[#1c1c1e]">{review.reviewerName}</p>
        {review.reviewerTitle && <p className="mt-1 text-xs text-[#8a8a84]">{review.reviewerTitle}</p>}
      </div>
    </div>
  )
}

function FeaturedWorkCard({ item, onOpen }: { item: NonNullable<PublicCreatorPortfolio['featuredWork']>[number]; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!item.video}
      className="group grid overflow-hidden rounded-[11px] border border-[#e2e2dc] bg-white text-left shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.09)] disabled:cursor-default sm:grid-cols-[120px,1fr]"
    >
      <div className="relative aspect-[9/16] bg-[#111111] sm:h-full sm:min-h-[238px]">
        {item.video ? <VideoThumbnail item={item.video} /> : <div className="h-full w-full bg-[#111111]" />}
        {item.video && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition group-hover:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#111111] shadow-[0_14px_30px_rgba(0,0,0,0.2)]"><Play className="h-4 w-4 fill-current" /></span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b8b84]">{item.label}</p>
        {item.metric && (
          <p className="mt-4 text-[clamp(2.2rem,5vw,3.2rem)] leading-[0.85] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.07em' }}>
            {item.metric}
          </p>
        )}
        <h3 className={`${item.metric ? 'mt-4 text-xl' : 'mt-4 text-2xl'} leading-[0.98] text-[#1c1c1e]`} style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
          {item.title}
        </h3>
        {item.note && <p className="mt-4 text-sm leading-6 text-[#686862]">{item.note}</p>}
      </div>
    </button>
  )
}

function ownerPrimaryAction(isOwner: boolean) {
  if (!isOwner) return null

  return (
    <Link
      href="/profile/edit"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9d9d2] bg-white px-5 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:-translate-y-0.5 hover:border-[#c7c7bf]"
    >
      <Pencil className="h-4 w-4" />
      Edit Profile
    </Link>
  )
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

function IntroVideoCard({ item, creatorFirstName, onOpen }: { item: PublicPortfolioVideo; creatorFirstName: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-[11px] border border-[#dfdfd7] bg-[#151515] text-left shadow-[0_14px_34px_rgba(0,0,0,0.14)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.18)] lg:max-w-[240px]"
      aria-label={`Play ${creatorFirstName}'s intro video`}
    >
      <div className="aspect-[9/16] bg-[#111111]">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnailUrl} alt={`${creatorFirstName} intro video`} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
        ) : item.kind === 'cloudflare' && item.cloudflareIframeUrl ? (
          <iframe
            title={`${creatorFirstName} intro video`}
            src={item.cloudflareIframeUrl}
            className="h-full w-full pointer-events-none"
            allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
            tabIndex={-1}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(204,255,0,0.22),transparent_35%),#111111]">
            <Video className="h-10 w-10 text-white/55" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ccff00] text-[#1c1c1e] shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition group-hover:scale-105">
          <Play className="h-5 w-5 fill-current" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Intro video</p>
        <p className="mt-1 text-2xl leading-tight text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.045em' }}>
          Meet {creatorFirstName}
        </p>
      </div>
    </button>
  )
}

function VideoCard({ item, onOpen }: { item: PublicPortfolioVideo; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[11px] border border-[#e2e2dc] bg-white text-left shadow-[0_10px_28px_rgba(0,0,0,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]"
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
        className="relative w-full max-w-5xl overflow-hidden rounded-[14px] bg-[#0f0f10] text-white shadow-[0_28px_90px_rgba(0,0,0,0.42)]"
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

function EmptyPortfolioState({ socials }: { socials: PublicPortfolioSocial[] }) {
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
          This creator hasn&apos;t added portfolio videos yet. For now, the best way to review their work is through their social profiles.
        </p>
        {socials.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {socials.map((social) => (
              <a
                key={`${social.platform}-${social.url}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9e9a9] bg-[#f6ffd2] px-4 py-2.5 text-sm font-semibold text-[#2f4a00] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(140,180,0,0.15)]"
              >
                {platformIcon(social.platform)}
                <span>{platformLabel(social.platform)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortfolioPageClient({
  portfolio,
  isOwner,
}: {
  portfolio: PublicCreatorPortfolio
  isOwner: boolean
}) {
  const [activeVideo, setActiveVideo] = useState<PublicPortfolioVideo | null>(null)
  const [activeCategory, setActiveCategory] = useState<(typeof PORTFOLIO_CATEGORIES)[number]>('All')
  const contactEmail = useMemo(() => getContactEmail(portfolio), [portfolio])
  const socialCTAs = useMemo(
    () => portfolio.socials.filter((social) => ['tiktok', 'instagram', 'youtube'].includes(social.platform)).slice(0, 3),
    [portfolio.socials],
  )



  const categoryCounts = useMemo(() => {
    return PORTFOLIO_CATEGORIES.reduce<Record<string, number>>((acc, category) => {
      if (category === 'All') {
        acc[category] = portfolio.portfolioItems.length
      } else {
        acc[category] = portfolio.portfolioItems.filter((item) => normalizePortfolioCategory(item.category) === category).length
      }
      return acc
    }, {})
  }, [portfolio.portfolioItems])

  const filteredPortfolioItems = useMemo(() => {
    const items = activeCategory === 'All'
      ? portfolio.portfolioItems
      : portfolio.portfolioItems.filter((item) => normalizePortfolioCategory(item.category) === activeCategory)
    return items.slice(0, 4)
  }, [activeCategory, portfolio.portfolioItems])

  const primaryContactHref = 'https://ottougc.com'

  const workedWithLogos = (portfolio.brandLogos || []).slice(0, 6)
  const reviews = (portfolio.reviews || []).slice(0, 8)
  const featuredWork = (portfolio.featuredWork || []).slice(0, 4)

  const topProofLabel = reviews.length > 0
    ? `${reviews.length} brand review${reviews.length === 1 ? '' : 's'}`
    : workedWithLogos.length > 0
      ? `Worked with ${workedWithLogos.length} brand${workedWithLogos.length === 1 ? '' : 's'}`
      : `${portfolio.stats.totalVideos} portfolio video${portfolio.stats.totalVideos === 1 ? '' : 's'}`

  const responseTimeLabel = formatResponseTime(portfolio.stats.responseTimeHours)
  const availabilityText = portfolio.isAvailable ? 'Available now' : 'Busy right now'
  const creatorFirstName = getFirstName(portfolio.fullName)

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f2_100%)] text-[#363535]" style={{ fontFamily: 'var(--font-open-sans)' }}>
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#e7e7df] bg-white px-4 py-2 text-sm font-semibold text-[#1c1c1e] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Otto
            </Link>
            {ownerPrimaryAction(isOwner)}
          </div>

          <section className="px-1 pt-10 sm:px-6 lg:px-10 lg:pt-14">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 inline-flex items-center gap-2 text-sm text-[#55554f]">
                <span className="tracking-[0.08em] text-[#2f8f55]">★★★★★</span>
                <span>{topProofLabel}</span>
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                <div className="max-w-4xl">
                  <div className="mb-5 flex items-center gap-4">
                    <p className="text-xl font-semibold text-[#363535]">Hi, I’m {creatorFirstName}</p>
                    {portfolio.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={portfolio.avatarUrl} alt={portfolio.fullName} className="h-12 w-12 rounded-full border-4 border-[#ccff00] bg-[#ccff00] object-cover shadow-[0_12px_34px_rgba(0,0,0,0.14)]" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#ccff00] bg-[#1c1c1e] text-sm font-semibold text-white shadow-[0_12px_34px_rgba(0,0,0,0.14)]">{getInitials(portfolio.fullName)}</span>
                    )}
                  </div>

                  <h1 className="text-[clamp(3.8rem,11vw,7.8rem)] leading-[0.88] text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.075em' }}>
                    {portfolio.mainPlatform ? `${platformLabel(portfolio.mainPlatform)} creator` : 'UGC creator'}
                  </h1>

                  <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5f5f59]">
                    {portfolio.bio || `${portfolio.fullName} creates short-form product videos for brands that need clear demos, sharp hooks, and content people actually understand.`}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <a
                      href={primaryContactHref}
                      className="inline-flex items-center justify-center rounded-full bg-[#ccff00] px-6 py-3 text-base font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]"
                    >
                      Work with {creatorFirstName}
                    </a>

                    {socialCTAs.slice(0, 3).map((social) => (
                      <a
                        key={`${social.platform}-hero`}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${socialButtonClass(social.platform)}`}
                      >
                        {platformIcon(social.platform)}
                        {platformLabel(social.platform)}
                      </a>
                    ))}
                  </div>
                </div>

                {portfolio.introVideo ? (
                  <IntroVideoCard item={portfolio.introVideo} creatorFirstName={creatorFirstName} onOpen={() => setActiveVideo(portfolio.introVideo || null)} />
                ) : ownerPrimaryAction(isOwner)}
              </div>
            </div>
          </section>

          {workedWithLogos.length > 0 && (
            <section className="mt-12 overflow-hidden border-y border-[#e7e7df] py-7">
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Brands I’ve worked with</p>
              <div className="relative -mx-5 sm:-mx-8 lg:-mx-12">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#f7f7f2] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#f7f7f2] to-transparent" />
                <div className="brand-logo-track flex w-max items-center">
                  {[...workedWithLogos, ...workedWithLogos, ...workedWithLogos].map((logo, index) => (
                    <BrandLogoMark key={`${logo}-${index}`} label={logo} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section id="portfolio" className="mt-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Portfolio</p>
                <h2 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  Videos
                </h2>
                <p className="mt-2 text-sm text-[#6d6d66]">
                  {portfolio.portfolioItems.length} video{portfolio.portfolioItems.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {portfolio.portfolioItems.length === 0 ? (
              <EmptyPortfolioState socials={socialCTAs} />
            ) : (
              <>
                <div className="mb-6 flex flex-wrap gap-2">
                  {PORTFOLIO_CATEGORIES.map((category) => {
                    const active = activeCategory === category
                    const count = categoryCounts[category] || 0
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-[#ccff00] bg-[#ccff00] text-[#1c1c1e]' : 'border-[#e8e8e4] bg-white text-[#1c1c1e] hover:border-[#ccff00]'}`}
                      >
                        <span>{category}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? 'bg-[#1c1c1e] text-[#ccff00]' : 'bg-[#f0f0ec] text-[#6b6b6b]'}`}>{count}</span>
                      </button>
                    )
                  })}
                </div>

                {filteredPortfolioItems.length === 0 ? (
                  <div className="rounded-[11px] border border-dashed border-[#dbdbd5] bg-[#fcfcfa] p-6 text-sm text-[#6b6b6b]">
                    No videos in this category yet.
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredPortfolioItems.map((item) => (
                      <VideoCard key={item.id} item={item} onOpen={() => setActiveVideo(item)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {reviews.length > 0 && (
            <section className="mt-16 overflow-hidden py-8">
              <div className="mx-auto mb-8 max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Reviews</p>
                <h2 className="mt-3 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.92] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.065em' }}>
                  What brands say
                </h2>
              </div>
              <div className="relative -mx-5 sm:-mx-8 lg:-mx-12">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#f7f7f2] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#f7f7f2] to-transparent" />
                <div className="review-card-track flex w-max items-center py-4">
                  {[...reviews, ...reviews].map((review, index) => (
                    <ReviewCard key={`${review.reviewerName}-${index}`} review={review} featured={index % reviews.length === 0} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {featuredWork.length > 0 && (
            <section className="mt-16">
              <div className="mb-8 max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Featured work</p>
                <h2 className="mt-3 text-[clamp(2.5rem,6vw,4.8rem)] leading-[0.92] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.065em' }}>
                  Videos I’m proud of
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {featuredWork.map((item) => <FeaturedWorkCard key={`${item.label}-${item.title}`} item={item} onOpen={item.video ? () => setActiveVideo(item.video || null) : undefined} />)}
              </div>
            </section>
          )}

          <section className="mt-12 overflow-hidden rounded-[36px] bg-[#111111] px-6 py-8 text-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:px-8 sm:py-10 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Work together</p>
                <h2 className="mt-3 text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  Ready to brief {creatorFirstName}?
                </h2>
                <p className="mt-4 text-base leading-7 text-white/70">
                  Send the product, timeline, and deliverables you need. Keep it specific and easy to answer.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                <a
                  href={primaryContactHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ccff00] px-6 py-3.5 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]"
                >
                  Work with {portfolio.fullName.split(' ')[0] || portfolio.fullName}
                </a>

                {socialCTAs.map((social) => (
                  <a
                    key={`${social.platform}-cta`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {platformIcon(social.platform)}
                    View on {platformLabel(social.platform)}
                  </a>
                ))}

                {isOwner && (
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {activeVideo && <VideoLightbox item={activeVideo} onClose={() => setActiveVideo(null)} />}
    </>
  )
}
