'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import MuxPlayer from '@mux/mux-player-react'
import {
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock3,
  MapPin,
  Play,
  Sparkles,
} from 'lucide-react'
import type { PublicCreatorPortfolio, PublicPortfolioSocial, PublicPortfolioVideo } from '@/lib/public-creator-portfolio'

function formatCompactNumber(value: number) {
  if (!value) return '0'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function platformLabel(platform: string) {
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'website') return 'Website'
  return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Portfolio'
}

function getSocialIcon(platform: string) {
  if (platform === 'instagram') return <Camera className="h-4 w-4" />
  if (platform === 'youtube') return <Play className="h-4 w-4" />
  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.12v13.58a2.67 2.67 0 1 1-2.67-2.67c.23 0 .45.03.66.08V9.82a5.8 5.8 0 0 0-.66-.04A5.79 5.79 0 1 0 15.82 15V8.07a7.9 7.9 0 0 0 4.62 1.48V6.69h-.85Z" />
      </svg>
    )
  }
  return <ArrowUpRight className="h-4 w-4" />
}

function getVideoPlatformIcon(platform: string) {
  if (platform === 'youtube') return <Play className="h-3.5 w-3.5" />
  if (platform === 'instagram') return <Camera className="h-3.5 w-3.5" />
  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.12v13.58a2.67 2.67 0 1 1-2.67-2.67c.23 0 .45.03.66.08V9.82a5.8 5.8 0 0 0-.66-.04A5.79 5.79 0 1 0 15.82 15V8.07a7.9 7.9 0 0 0 4.62 1.48V6.69h-.85Z" />
      </svg>
    )
  }
  return <Play className="h-3.5 w-3.5" />
}

function OwnerActions({ isOwner }: { isOwner: boolean }) {
  if (!isOwner) return null

  return (
    <Link href="/profile/edit" className="btn-ghost border border-[#e8e8e4] bg-white/80 px-5 py-3 text-sm font-semibold text-[#1c1c1e] backdrop-blur">
      Edit profile
    </Link>
  )
}

function SocialLinks({ socials }: { socials: PublicPortfolioSocial[] }) {
  if (!socials.length) return null

  return (
    <div className="flex flex-wrap gap-3">
      {socials.map((social) => (
        <a
          key={`${social.platform}-${social.url}`}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white/80 px-4 py-2.5 text-sm font-medium text-[#363535] transition hover:-translate-y-0.5 hover:border-[#d6d6d1] hover:bg-white"
        >
          {getSocialIcon(social.platform)}
          <span>{social.label}</span>
        </a>
      ))}
    </div>
  )
}

function VideoPreview({ item, active }: { item: PublicPortfolioVideo; active: boolean }) {
  if (active && item.kind === 'youtube' && item.youtubeId) {
    return (
      <iframe
        title={item.caption || 'Portfolio video'}
        src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1&rel=0`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  if (active && item.kind === 'mux' && item.playbackId) {
    return <MuxPlayer streamType="on-demand" playbackId={item.playbackId} autoPlay className="h-full w-full object-cover" />
  }

  if (active && item.kind === 'direct') {
    return <video src={item.url} controls autoPlay playsInline className="h-full w-full object-cover" />
  }

  if (item.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.thumbnailUrl} alt={item.caption || 'Portfolio video'} className="h-full w-full object-cover" />
    )
  }

  return <div className="flex h-full items-center justify-center bg-[#111111] text-white/70">Video preview</div>
}

function PortfolioCard({
  item,
  isActive,
  onPlay,
}: {
  item: PublicPortfolioVideo
  isActive: boolean
  onPlay: () => void
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[#e8e8e4] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
      <div className="relative aspect-[9/16] overflow-hidden bg-[#111111]">
        <VideoPreview item={item} active={isActive} />
        {!isActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/10" />
            <button
              type="button"
              onClick={onPlay}
              className="absolute inset-0 flex items-center justify-center"
              aria-label={`Play ${item.caption || 'portfolio video'}`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#111111] shadow-lg transition hover:scale-105">
                <Play className="ml-1 h-6 w-6 fill-current" />
              </span>
            </button>
          </>
        )}
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-semibold text-[#1c1c1e] shadow-sm">
          {getVideoPlatformIcon(item.platform)}
          <span>{platformLabel(item.platform)}</span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-4 text-xs text-[#7a7a75]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(item.createdAt)}
          </span>
          <span>{formatCompactNumber(item.viewCount)} views</span>
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight text-[#1c1c1e]">
            {item.caption || `${platformLabel(item.platform)} portfolio clip`}
          </h3>
        </div>
      </div>
    </article>
  )
}

export default function PortfolioPageClient({
  portfolio,
  isOwner,
}: {
  portfolio: PublicCreatorPortfolio
  isOwner: boolean
}) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const primarySocial = useMemo(
    () => portfolio.socials.find((social) => ['tiktok', 'instagram', 'youtube'].includes(social.platform)) || portfolio.socials[0] || null,
    [portfolio.socials],
  )

  const workWithHref = `/signup?creator=${encodeURIComponent(portfolio.id)}&handle=${encodeURIComponent(portfolio.handle)}`

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(204,255,0,0.18),_transparent_30%),linear-gradient(180deg,#fafaf7_0%,#f6f6f1_48%,#fafaf8_100%)] text-[#363535]">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white/80 px-4 py-2 text-sm font-semibold text-[#1c1c1e] backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#7ea400]" />
            Otto
          </Link>
          <OwnerActions isOwner={isOwner} />
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="rounded-[36px] border border-[#e8e8e4] bg-white/88 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.05)] backdrop-blur sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {portfolio.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portfolio.avatarUrl} alt={portfolio.fullName} className="h-24 w-24 rounded-[28px] border border-[#e8e8e4] object-cover shadow-sm sm:h-28 sm:w-28" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-dashed border-[#dadad5] bg-[#f3f3ee] text-3xl font-semibold text-[#8a8a84] sm:h-28 sm:w-28">
                  {portfolio.fullName.slice(0, 1)}
                </div>
              )}

              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-[#111111]">
                    {portfolio.fullName}
                  </h1>
                  {portfolio.isAvailable && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf9c1] px-3 py-1.5 text-sm font-semibold text-[#2f4a00]">
                      <CheckCircle2 className="h-4 w-4" />
                      Available
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b6b6b]">
                  <span>@{portfolio.handle}</span>
                  {portfolio.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {portfolio.location}
                    </span>
                  )}
                </div>

                {portfolio.bio && (
                  <p className="max-w-3xl text-base leading-7 text-[#4f4f4a] sm:text-lg">
                    {portfolio.bio}
                  </p>
                )}

                {portfolio.nicheTags.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
                    {portfolio.nicheTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-[#e7e7e1] bg-[#fafaf7] px-3 py-1.5 text-sm font-medium text-[#565650]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <SocialLinks socials={portfolio.socials} />
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[28px] border border-[#e8e8e4] bg-[#111111] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Stats</p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.05em]">{portfolio.stats.completedCampaigns}</p>
                  <p className="mt-1 text-xs text-white/60">Campaigns completed</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.05em]">{portfolio.stats.totalVideos}</p>
                  <p className="mt-1 text-xs text-white/60">Portfolio videos</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.05em]">{formatCompactNumber(portfolio.stats.avgViews)}</p>
                  <p className="mt-1 text-xs text-white/60">Avg views</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e8e8e4] bg-white/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.04)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a84]">Trust signals</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#f7f7f2] p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1c1c1e]">
                    <Clock3 className="h-4 w-4 text-[#7ea400]" />
                    {portfolio.stats.responseTimeHours ? `Typically replies within ${portfolio.stats.responseTimeHours} hours` : 'Reply time building up'}
                  </p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">Based on Otto message history.</p>
                </div>
                <div className="rounded-2xl bg-[#f7f7f2] p-4">
                  <p className="text-sm font-semibold text-[#1c1c1e]">{portfolio.stats.completedCampaigns} campaigns completed on Otto</p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">Verified work history from platform deals.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f7f7f2] p-4">
                    <p className="text-2xl font-semibold tracking-[-0.05em] text-[#111111]">{portfolio.stats.videosDelivered}</p>
                    <p className="mt-1 text-sm text-[#6b6b6b]">Videos delivered</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f7f2] p-4">
                    <p className="text-2xl font-semibold tracking-[-0.05em] text-[#111111]">{portfolio.stats.onTimePercentage ?? '—'}{portfolio.stats.onTimePercentage !== null ? '%' : ''}</p>
                    <p className="mt-1 text-sm text-[#6b6b6b]">On-time rate</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8a84]">Portfolio</p>
              <h2 className="mt-2 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-[#111111]">
                Selected work
              </h2>
            </div>
          </div>

          {portfolio.portfolioItems.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#dcdcd6] bg-white/70 p-12 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#1c1c1e]">No videos yet</p>
              <p className="mt-2 text-sm text-[#6b6b6b]">This creator hasn&apos;t added portfolio videos yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {portfolio.portfolioItems.map((item) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  isActive={activeVideoId === item.id}
                  onPlay={() => setActiveVideoId(item.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 rounded-[36px] border border-[#e8e8e4] bg-[#111111] px-7 py-8 text-white shadow-[0_30px_90px_rgba(0,0,0,0.16)] sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Work together</p>
              <h2 className="mt-2 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-white">
                Work with {portfolio.fullName}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
                Reach out through Otto to discuss your brief, timeline, and deliverables.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={workWithHref} className="btn-primary px-6 py-3 text-sm font-semibold">
                Work with {portfolio.fullName}
              </Link>
              {primarySocial && (
                <a
                  href={primarySocial.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  View my {primarySocial.label}
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
