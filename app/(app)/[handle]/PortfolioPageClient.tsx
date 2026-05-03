'use client'

import { useMemo, useState } from 'react'
import { PORTFOLIO_CATEGORIES, normalizePortfolioCategory } from '@/lib/portfolio-media'
import Link from 'next/link'
import MuxPlayer from '@mux/mux-player-react'
import {
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Play,
  Video,
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

function getVideoTitle(item: PublicPortfolioVideo) {
  return item.caption?.trim() || `${platformLabel(item.platform)} portfolio sample`
}

function getYouTubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
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

function FeaturedWorkCard({ item }: { item: NonNullable<PublicCreatorPortfolio['featuredWork']>[number] }) {
  return (
    <article className="overflow-hidden rounded-[11px] border border-[#e2e2dc] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.09)]">
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b8b84]">{item.label}</p>
        {item.metric && (
          <p className="mt-5 text-[clamp(2.7rem,5vw,4rem)] leading-[0.84] text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.075em' }}>
            {item.metric}
          </p>
        )}
        <h3 className={`${item.metric ? 'mt-5 text-2xl' : 'mt-4 text-3xl'} leading-[0.95] text-[#1c1c1e]`} style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.055em' }}>
          {item.title}
        </h3>
        {item.note && <p className="mt-4 text-sm leading-6 text-[#686862]">{item.note}</p>}
      </div>
      {item.video && (
        <div className="border-t border-[#eeeeea] bg-[#111111]">
          <div className="aspect-[9/16] max-h-[420px] w-full">
            <InlinePlayableVideo item={item.video} title={item.title} className="h-full w-full" />
          </div>
        </div>
      )}
    </article>
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

function InlineVideoPlayer({ item, title }: { item: PublicPortfolioVideo; title?: string }) {
  const playerTitle = title || getVideoTitle(item)

  if (item.kind === 'youtube' && item.youtubeId) {
    return (
      <iframe
        title={playerTitle}
        src={getYouTubeEmbedUrl(item.youtubeId)}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  if (item.kind === 'cloudflare' && item.cloudflareIframeUrl) {
    return (
      <iframe
        title={playerTitle}
        src={item.cloudflareIframeUrl}
        className="h-full w-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (item.kind === 'mux' && item.playbackId) {
    return <MuxPlayer streamType="on-demand" playbackId={item.playbackId} className="h-full w-full object-cover" />
  }

  return <video src={item.url} controls playsInline className="h-full w-full bg-black object-cover" />
}

function InlinePlayableVideo({ item, title, className = '' }: { item: PublicPortfolioVideo; title?: string; className?: string }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-[#111111] ${className}`}>
      {playing ? (
        <InlineVideoPlayer item={item} title={title} />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative block h-full w-full text-left"
          aria-label={`Play ${title || getVideoTitle(item)}`}
        >
          <VideoThumbnail item={item} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/8 to-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 text-[#111111] shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition group-hover:scale-105">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

function IntroVideoCard({ item, creatorFirstName }: { item: PublicPortfolioVideo; creatorFirstName: string }) {
  return (
    <div className="overflow-hidden rounded-[11px] border border-[#dfdfd7] bg-[#111111] shadow-[0_14px_34px_rgba(0,0,0,0.14)] lg:max-w-[320px]">
      <div className="aspect-[9/16] bg-[#111111]">
        <InlinePlayableVideo item={item} title={`${creatorFirstName} intro video`} className="h-full w-full" />
      </div>
      <div className="border-t border-white/10 bg-[#151515] px-4 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Intro video</p>
        <p className="mt-1 text-lg leading-tight text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}>
          Meet {creatorFirstName}
        </p>
      </div>
    </div>
  )
}


function VideoCard({ item }: { item: PublicPortfolioVideo }) {
  return (
    <article className="overflow-hidden rounded-[11px] border border-[#e2e2dc] bg-white text-left shadow-[0_10px_28px_rgba(0,0,0,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]">
      <div className="relative aspect-[9/16] overflow-hidden bg-[#111111]">
        <InlinePlayableVideo item={item} className="h-full w-full" />
        <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#1c1c1e] shadow-sm">
          {platformIcon(item.platform, 'h-3.5 w-3.5')}
          <span>{platformLabel(item.platform)}</span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-[#1c1c1e]">{getVideoTitle(item)}</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6e6e67]">
          <span>{formatCompactNumber(item.viewCount)} views</span>
          <span className="text-[#c5c5bc]">•</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>
    </article>
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
  const [activeCategory, setActiveCategory] = useState<(typeof PORTFOLIO_CATEGORIES)[number]>('All')
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
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
                <div className="max-w-4xl">
                  <div className="mb-5 flex flex-col gap-4">
                    <div className="inline-flex items-center gap-2 text-sm text-[#55554f]">
                      <span className="tracking-[0.08em] text-[#2f8f55]">★★★★★</span>
                      <span>{topProofLabel}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-semibold text-[#363535]">Hi, I’m {creatorFirstName}</p>
                    {portfolio.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={portfolio.avatarUrl} alt={portfolio.fullName} className="h-12 w-12 rounded-full border-4 border-[#ccff00] bg-[#ccff00] object-cover shadow-[0_12px_34px_rgba(0,0,0,0.14)]" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#ccff00] bg-[#1c1c1e] text-sm font-semibold text-white shadow-[0_12px_34px_rgba(0,0,0,0.14)]">{getInitials(portfolio.fullName)}</span>
                    )}
                    </div>
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
                  <IntroVideoCard item={portfolio.introVideo} creatorFirstName={creatorFirstName} />
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
                      <VideoCard key={item.id} item={item} />
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
                {featuredWork.map((item) => <FeaturedWorkCard key={`${item.label}-${item.title}`} item={item} />)}
              </div>
            </section>
          )}

          <section className="mt-16 overflow-hidden rounded-[28px] border border-[#e6e6df] bg-[#111111] p-1 shadow-[0_28px_90px_rgba(0,0,0,0.16)]">
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(204,255,0,0.18),transparent_32%),#111111] px-6 py-8 text-white sm:px-8 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Rate card</p>
                  <h2 className="mt-3 text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.9] text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.065em' }}>
                    Ways to work with me
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
                    Simple starting points for brands that already know what they need. Final scope depends on usage rights, timelines, and deliverables.
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Want to check fit first?</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">For now this routes back through Otto. Later creators will connect a booking calendar or an Otto-native availability flow.</p>
                  <a href={primaryContactHref} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] px-5 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]">
                    Request a booking
                  </a>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { name: 'Single UGC video', price: 'From £250', desc: 'One short-form concept, filmed and edited for organic social.' },
                  { name: '3-video test pack', price: 'From £650', desc: 'Three hooks or angles so the brand can test what lands fastest.' },
                  { name: 'Monthly creator retainer', price: 'From £1.5K', desc: 'Ongoing product-led content with a consistent creator face.' },
                ].map((item) => (
                  <div key={item.name} className="rounded-[18px] border border-white/10 bg-white/[0.07] p-5">
                    <p className="text-sm font-semibold text-white/70">{item.name}</p>
                    <p className="mt-4 text-[clamp(2rem,4vw,3.2rem)] leading-[0.88] text-white" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.065em' }}>{item.price}</p>
                    <p className="mt-4 text-sm leading-6 text-white/58">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

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

    </>
  )
}
