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
    if (activeCategory === 'All') return portfolio.portfolioItems
    return portfolio.portfolioItems.filter((item) => normalizePortfolioCategory(item.category) === activeCategory)
  }, [activeCategory, portfolio.portfolioItems])

  const primaryContactHref = contactEmail
    ? `mailto:${contactEmail}`
    : socialCTAs[0]?.url || `/signup?creator=${encodeURIComponent(portfolio.id)}&handle=${encodeURIComponent(portfolio.handle)}`

  const responseTimeLabel = formatResponseTime(portfolio.stats.responseTimeHours)
  const availabilityText = portfolio.isAvailable ? 'Available now' : 'Busy right now'
  const creatorFirstName = getFirstName(portfolio.fullName)
  const readinessLabel = portfolio.portfolioItems.length >= 6 ? 'Strong proof of work' : portfolio.portfolioItems.length >= 3 ? 'Ready for brand review' : 'Still building depth'

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

          <section className="overflow-hidden rounded-[36px] border border-[#ecece5] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.06)]">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 sm:p-8 lg:p-12">
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
                        <h1
                          className="mt-2 text-[clamp(2.4rem,7vw,4.8rem)] leading-[0.92] text-[#111111]"
                          style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.06em' }}
                        >
                          {portfolio.fullName}
                        </h1>
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${portfolio.isAvailable ? 'bg-[#efffd3] text-[#355400]' : 'bg-[#f3f3ef] text-[#64645d]'}`}>
                        <Circle className={`h-2.5 w-2.5 fill-current ${portfolio.isAvailable ? 'text-[#98d800]' : 'text-[#a3a39b]'}`} />
                        {availabilityText}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#6d6d66]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#f6f6f2] px-3 py-1.5 text-[#4f4f49]">
                        <UserRound className="h-4 w-4" />
                        @{portfolio.handle}
                      </span>
                      {portfolio.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-[#7a7a73]" />
                          {portfolio.location}
                        </span>
                      )}
                    </div>

                    {(contactEmail || socialCTAs.length > 0 || isOwner) && (
                      <div className="mt-5 flex flex-wrap gap-3">
                        {contactEmail ? (
                          <a
                            href={`mailto:${contactEmail}`}
                            className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                          >
                            <Mail className="h-4 w-4" />
                            {isOwner ? contactEmail : maskEmail(contactEmail)}
                          </a>
                        ) : (
                          <a
                            href={primaryContactHref}
                            target={primaryContactHref.startsWith('http') ? '_blank' : undefined}
                            rel={primaryContactHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                          >
                            <Mail className="h-4 w-4" />
                            Contact
                          </a>
                        )}

                        {!isOwner && (
                          <a
                            href={primaryContactHref}
                            target={primaryContactHref.startsWith('http') ? '_blank' : undefined}
                            rel={primaryContactHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-2 rounded-full border border-[#dbdbd3] bg-white px-5 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:-translate-y-0.5 hover:border-[#c8c8bf]"
                          >
                            Work with {portfolio.fullName.split(' ')[0] || portfolio.fullName}
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {portfolio.bio && (
                  <div className="mt-8 max-w-3xl">
                    <p className="text-lg leading-8 text-[#4f4f49]">{portfolio.bio}</p>
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
                      <SocialLinksRow socials={portfolio.socials} />
                    </div>
                  </div>
                )}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Portfolio summary</p>
                  <dl className="mt-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-sm text-[#6c6c66]">Completed campaigns</dt>
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
                      <dt className="text-sm text-[#6c6c66]">Delivery reliability</dt>
                      <dd className="text-lg font-semibold text-[#1c1c1e]">
                        {portfolio.stats.onTimePercentage !== null ? `${portfolio.stats.onTimePercentage}% on time` : 'Building history'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[#ecece5] bg-white p-5 shadow-[0_14px_36px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Why this profile feels credible</p>
              <p className="mt-3 text-2xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                {readinessLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6d6d66]">
                {creatorFirstName} has enough public proof here for a brand to judge fit quickly instead of guessing from a thin profile.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#ecece5] bg-white p-5 shadow-[0_14px_36px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Fast brand read</p>
              <p className="mt-3 text-2xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                {portfolio.mainPlatform ? `${platformLabel(portfolio.mainPlatform)} creator` : 'UGC creator'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6d6d66]">
                Clear niche tags, social links, and portfolio samples make this page easier to scan in the first 10 seconds.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#ecece5] bg-white p-5 shadow-[0_14px_36px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b84]">Best next action</p>
              <p className="mt-3 text-2xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                Reach out with a brief
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6d6d66]">
                If {creatorFirstName.toLowerCase()} looks right, move straight into deliverables, timing, and content goals instead of asking for more basic profile info.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Portfolio</p>
                <h2 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  Portfolio
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
                  <div className="rounded-[24px] border border-dashed border-[#dbdbd5] bg-[#fcfcfa] p-6 text-sm text-[#6b6b6b]">
                    No videos in this category yet.
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredPortfolioItems.map((item) => (
                      <VideoCard key={item.id} item={item} onOpen={() => setActiveVideo(item)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="mt-12 rounded-[32px] border border-[#ecece5] bg-white p-6 shadow-[0_18px_48px_rgba(0,0,0,0.05)] sm:p-8 lg:p-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b8b84]">Trust stats</p>
                <h2 className="mt-2 text-[clamp(1.8rem,4vw,3rem)] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
                  Verified performance
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#6d6d66]">
                Pulled from Otto deal history, delivery logs, portfolio data, and message response patterns.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-[#edede7] bg-[#fafaf7] p-5">
                <p className="text-sm text-[#707069]">Campaigns completed</p>
                <p className="mt-3 text-4xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  {portfolio.stats.completedCampaigns}
                </p>
                <p className="mt-2 text-sm text-[#6d6d66]">Completed through active brand work on Otto.</p>
              </div>

              <div className="rounded-[24px] border border-[#edede7] bg-[#fafaf7] p-5">
                <p className="text-sm text-[#707069]">Videos delivered</p>
                <p className="mt-3 text-4xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  {portfolio.stats.videosDelivered}
                </p>
                <p className="mt-2 text-sm text-[#6d6d66]">Submitted content across campaigns and portfolio work.</p>
              </div>

              <div className="rounded-[24px] border border-[#edede7] bg-[#fafaf7] p-5">
                <p className="text-sm text-[#707069]">Average views</p>
                <p className="mt-3 text-4xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  {formatCompactNumber(portfolio.stats.avgViews)}
                </p>
                <p className="mt-2 text-sm text-[#6d6d66]">Average performance across videos with available view counts.</p>
              </div>

              <div className="rounded-[24px] border border-[#edede7] bg-[#fafaf7] p-5">
                <p className="text-sm text-[#707069]">Response time</p>
                <p className="mt-3 text-4xl text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  {portfolio.stats.responseTimeHours ? `${portfolio.stats.responseTimeHours}h` : '—'}
                </p>
                <p className="mt-2 text-sm text-[#6d6d66]">{responseTimeLabel}</p>
              </div>
            </div>
          </section>

          <section className="mt-12 overflow-hidden rounded-[36px] bg-[#111111] px-6 py-8 text-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:px-8 sm:py-10 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Work together</p>
                <h2 className="mt-3 text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.05em' }}>
                  Work with {portfolio.fullName}
                </h2>
                <p className="mt-4 text-base leading-7 text-white/70">
                  Reach out with your brief, content goals, deliverables, and timeline. This page is built to make first review easy — now move the conversation forward.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                <a
                  href={primaryContactHref}
                  target={primaryContactHref.startsWith('http') ? '_blank' : undefined}
                  rel={primaryContactHref.startsWith('http') ? 'noopener noreferrer' : undefined}
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
