'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Camera, Clock3, ExternalLink, Globe, Link2, Music4, Play, Search, Sparkles, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { buildYouTubeEmbedUrl, detectPortfolioPlatform, inferPortfolioThumbnail, isDirectVideoUrl, isRealPortfolioVideoUrl } from '@/lib/portfolio-media'

type CreatorProfileResponse = {
  id: string
  userId: string
  fullName: string
  handle: string
  bio: string
  avatarUrl: string | null
  mainPlatform: string
  followerRange: string
  incomeRange: string
  nicheTags: string[]
  socials: Array<{ platform: string; url: string }>
  portfolioItems: Array<{
    id: string
    url: string
    type: string
    platform: string | null
    caption: string | null
    thumbnail_url: string | null
  }>
}

const platformIconClassName = 'h-3.5 w-3.5'

function PlatformIcon({ platform }: { platform: string }) {
  const normalized = normalizePlatform(platform)

  if (normalized === 'tiktok') return <Music4 className={platformIconClassName} />
  if (normalized === 'instagram') return <Camera className={platformIconClassName} />
  if (normalized === 'youtube') return <Play className={platformIconClassName} />
  if (normalized === 'twitter' || normalized === 'x') return <span className="text-[11px] font-semibold leading-none">X</span>
  if (normalized === 'website') return <Globe className={platformIconClassName} />
  return <Link2 className={platformIconClassName} />
}

function platformLabel(value: string) {
  if (!value) return 'Platform'
  if (value === 'tiktok') return 'TikTok'
  if (value === 'instagram') return 'Instagram'
  if (value === 'youtube') return 'YouTube'
  if (value === 'twitter' || value === 'x') return 'X'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizePlatform(value?: string | null) {
  return (value || '').toLowerCase().trim()
}

function deriveThumbnail(item: CreatorProfileResponse['portfolioItems'][number]) {
  return inferPortfolioThumbnail(item.url, item.platform) || item.thumbnail_url || ''
}

function formatResponseTimeFromPortfolioCount(count: number) {
  if (count >= 6) return 'Fast replies likely'
  if (count >= 3) return 'Profile is review-ready'
  return 'Still building depth'
}

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

export default function CreatorPublicProfilePage() {
  const params = useParams()
  const creatorId = params.id as string
  const supabase = createClient()

  const [profile, setProfile] = useState<CreatorProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [isBrandViewer, setIsBrandViewer] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('Hey! We’d love to invite you to apply for an upcoming campaign on Otto.')
  const [inviteState, setInviteState] = useState<'idle' | 'sent'>('idle')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      const [profileResponse, authResponse] = await Promise.all([
        fetch(`/api/creators/${creatorId}`),
        supabase.auth.getUser(),
      ])

      if (!profileResponse.ok) {
        setError('Creator not found')
        setLoading(false)
        return
      }

      const profileData = (await profileResponse.json()) as CreatorProfileResponse
      setProfile(profileData)

      const user = authResponse.data.user
      if (user) {
        setIsOwner(user.id === profileData.userId)
        const { data: roleRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
        setIsBrandViewer(roleRow?.role === 'brand')
      } else {
        setIsOwner(false)
        setIsBrandViewer(false)
      }

      setLoading(false)
    }

    void load()
  }, [creatorId, supabase])

  const visiblePlatforms = useMemo(() => {
    if (!profile) return []
    const candidates = [profile.mainPlatform, ...profile.socials.map((social) => social.platform)]
    return Array.from(new Set(candidates.map((platform) => normalizePlatform(platform)).filter(Boolean))).slice(0, 4)
  }, [profile])

  const viablePortfolioItems = useMemo(() => {
    if (!profile) return []
    return profile.portfolioItems.filter((item) => isRealPortfolioVideoUrl(item.url || ''))
  }, [profile])

  const creatorFirstName = useMemo(() => (profile ? getFirstName(profile.fullName) : 'this creator'), [profile])
  const profileReadiness = viablePortfolioItems.length >= 6 ? 'Strong' : viablePortfolioItems.length >= 3 ? 'Review-ready' : 'In progress'
  const responseTimeLabel = formatResponseTimeFromPortfolioCount(viablePortfolioItems.length)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
        <div className="card max-w-lg text-center">
          <h1 className="font-display text-[#1c1c1e] text-3xl mb-2" style={{ letterSpacing: '-0.04em' }}>Creator not found</h1>
          <p className="text-sm text-[#6b6b6b] mb-5">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/explore" className="btn-primary inline-flex">Back to marketplace</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-5">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#1c1c1e] transition-colors"><Search className="h-4 w-4" /> Back to marketplace</Link>
        </div>

        <section className="mb-8 overflow-hidden rounded-[32px] border border-[#e8e8e4] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.05)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="w-24 h-24 rounded-3xl border border-[#e8e8e4] overflow-hidden bg-[#f0f0ec] flex items-center justify-center text-2xl font-semibold text-[#6b6b6b] flex-shrink-0 shadow-sm">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                  ) : (
                    profile.fullName?.[0] || '?'
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8a86]">Creator profile</p>
                      <h1 className="mt-2 font-display text-[#1c1c1e]" style={{ fontSize: 'clamp(30px, 5vw, 42px)', letterSpacing: '-0.045em', lineHeight: 1.0 }}>
                        {profile.fullName}
                      </h1>
                    </div>
                    {profile.followerRange && (
                      <span className="inline-flex items-center rounded-full bg-[#ccff00] px-3 py-1 text-xs font-semibold text-[#1c1c1e]">
                        {profile.followerRange}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full border border-[#e8e8e4] bg-[#fafaf7] px-3 py-1 text-xs font-semibold text-[#1c1c1e]">
                      {profileReadiness}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#6b6b6b]">
                    <span>@{profile.handle || 'creator'}</span>
                    {profile.mainPlatform && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f1] px-3 py-1.5 font-medium text-[#1c1c1e]">
                        <PlatformIcon platform={normalizePlatform(profile.mainPlatform)} />
                        {platformLabel(normalizePlatform(profile.mainPlatform))}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-[#4f4f4f] whitespace-pre-wrap leading-relaxed max-w-3xl">{profile.bio || 'This creator is building out their Otto profile.'}</p>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {visiblePlatforms.map((platform) => (
                      <span key={platform} className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e8e4] bg-white px-3 py-1.5 text-xs text-[#4f4f4f]">
                        <PlatformIcon platform={platform} />
                        <span>{platformLabel(platform)}</span>
                      </span>
                    ))}
                  </div>

                  {profile.nicheTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.nicheTags.map((niche) => (
                        <span key={niche} className="inline-flex rounded-full bg-[#f0f0ec] px-3 py-1.5 text-xs font-medium text-[#363535]">
                          {niche}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="border-t border-[#ecece5] bg-[#fafaf7] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-[28px] bg-[#111111] p-6 text-white shadow-[0_22px_60px_rgba(0,0,0,0.16)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">At a glance</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm text-white/65">Portfolio readiness</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-white">
                      <Sparkles className="h-4 w-4 text-[#ccff00]" />
                      {viablePortfolioItems.length} sample{viablePortfolioItems.length === 1 ? '' : 's'} ready
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">Response signal</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-white">
                      <Clock3 className="h-4 w-4 text-[#ccff00]" />
                      {responseTimeLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">Brand read</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-white">
                      <Star className="h-4 w-4 text-[#ccff00]" />
                      {profile.nicheTags.length > 0 ? `${profile.nicheTags.length} niche signal${profile.nicheTags.length === 1 ? '' : 's'}` : 'General profile'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-[#e8e8e1] bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-[#1c1c1e]">Fast summary</p>
                <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
                  {creatorFirstName} looks strongest for brands that want {profile.mainPlatform ? `${platformLabel(normalizePlatform(profile.mainPlatform))} content` : 'short-form content'} with clear portfolio proof and a cleaner public profile.
                </p>
              </div>

              <div className="mt-5 space-y-2">
                {isOwner ? (
                  <Link href="/profile/edit" className="btn-ghost w-full justify-center border border-[#e8e8e4] bg-white">Edit Profile</Link>
                ) : isBrandViewer ? (
                  <button onClick={() => setShowInviteModal(true)} className="btn-primary w-full justify-center">
                    Invite to apply
                  </button>
                ) : (
                  <Link href="/signup?type=brand" className="btn-ghost w-full justify-center border border-[#e8e8e4] bg-white">
                    Hire this creator
                  </Link>
                )}

                {!isOwner && (
                  <Link href="/signup" className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-[#6b6b6b] transition hover:text-[#1c1c1e]">
                    View on Otto
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display text-[#1c1c1e] text-2xl" style={{ letterSpacing: '-0.035em' }}>UGC Samples</h2>
            <span className="text-xs text-[#8a8a86]">{viablePortfolioItems.length} item{viablePortfolioItems.length === 1 ? '' : 's'}</span>
          </div>

          {viablePortfolioItems.length < 3 ? (
            <div className="card text-center py-12 px-6">
              <p className="text-base font-semibold text-[#1c1c1e]">Creator is building their portfolio</p>
              <p className="mt-2 text-[#6b6b6b] text-sm max-w-md mx-auto">Check back soon for more sample videos, or join Otto to connect with creators and post briefs directly.</p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup?type=brand" className="btn-primary inline-flex">Hire this creator</Link>
                <Link href="/signup" className="btn-ghost inline-flex border border-[#e8e8e4]">View on Otto</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
              {viablePortfolioItems.map((item) => {
                const platform = detectPortfolioPlatform(item.url, item.platform)
                const thumbnail = deriveThumbnail(item)
                const youtubeEmbedUrl = buildYouTubeEmbedUrl(item.url)
                const directVideo = isDirectVideoUrl(item.url)

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-[#e8e8e4] bg-white shadow-sm transition-transform hover:-translate-y-1"
                  >
                    <div className="relative aspect-[9/16] bg-[#1c1c1e]">
                      {directVideo ? (
                        <video src={item.url} controls className="h-full w-full object-cover" />
                      ) : youtubeEmbedUrl ? (
                        <iframe
                          src={youtubeEmbedUrl}
                          title={item.caption || 'YouTube portfolio sample'}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : thumbnail ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbnail} alt={item.caption || 'Portfolio sample'} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/70 text-sm"><Play className="h-6 w-6" /><span>Video sample</span></a>
                      )}
                      <div className="absolute top-3 left-3 rounded-full bg-black/60 text-white text-[11px] px-2.5 py-1 inline-flex items-center gap-1.5">
                        <PlatformIcon platform={platform} />
                        <span>{platformLabel(platform)}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-[#363535] line-clamp-2">{item.caption || 'Untitled sample'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d8d8d2] bg-[#fafaf9] p-5">
            <h3 className="font-display text-[#1c1c1e] text-2xl mb-2" style={{ letterSpacing: '-0.03em' }}>Invite {profile.fullName} to apply</h3>
            <p className="text-sm text-[#6b6b6b] mb-4">Write a message they&apos;ll receive with your campaign invite.</p>
            <textarea
              rows={5}
              value={inviteMessage}
              onChange={(event) => setInviteMessage(event.target.value)}
              className="w-full rounded-xl border border-[#e8e8e4] bg-white px-4 py-3 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              placeholder="Share the campaign details and why they’re a fit..."
            />
            {inviteState === 'sent' && (
              <p className="mt-3 text-xs font-medium text-[#1c1c1e] bg-[#ccff00] inline-flex rounded-full px-3 py-1">Invite message saved</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setShowInviteModal(false)} className="btn-ghost border border-[#e8e8e4]">Cancel</button>
              <button
                onClick={() => {
                  setInviteState('sent')
                  setTimeout(() => {
                    setShowInviteModal(false)
                    setInviteState('idle')
                  }, 900)
                }}
                className="btn-primary"
                disabled={!inviteMessage.trim()}
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
