'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import VideoThumbnail from '@/components/VideoThumbnail'
import { Calendar, ExternalLink, MapPin, PoundSterling, Sparkles } from 'lucide-react'

type Social = { id: string; creator_id: string; platform: string; url: string }
type PortfolioItem = {
  id: string
  creator_id: string
  type: string
  url: string
  thumbnail_url: string | null
  caption: string | null
  platform: string | null
  views_count: number
  sort_order: number
  created_at: string
}
type Creator = {
  id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  location: string | null
  timezone: string | null
  hourly_rate: string | null
  availability: string
  is_verified: boolean
  is_pro: boolean
  profile_views: number
  headline?: string
  website?: string
  created_at: string
  updated_at: string
}
type CreatorTag = { id: string; creator_id: string; tag: string }

type CreatorFull = Creator & {
  creator_socials: Social[]
  creator_tags: CreatorTag[]
  portfolio_items: PortfolioItem[]
}

const PORTFOLIO_TABS = ['All', 'Tech & Apps', 'AI', 'Travel', 'Health & Fitness'] as const

const socialLabels: Record<string, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  twitter: 'X',
  other: 'Link',
  website: 'Website',
}

const socialColors: Record<string, string> = {
  tiktok: 'bg-[#f0f0ec] text-[#363535]',
  youtube: 'bg-red-50 text-red-600',
  instagram: 'bg-pink-50 text-pink-600',
  twitter: 'bg-slate-100 text-slate-700',
  other: 'bg-[#f0f0ec] text-[#6b6b6b]',
  website: 'bg-[#ccff00]/25 text-[#363535]',
}

function isMuxId(url: string) {
  return Boolean(url) && !url.includes('/') && !url.startsWith('http')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function formatPlatform(platform?: string | null) {
  if (!platform) return 'Portfolio clip'
  return socialLabels[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)
}

function classifyPortfolioItem(item: PortfolioItem) {
  const source = `${item.caption || ''} ${item.platform || ''}`.toLowerCase()
  if (/\bai\b|chatgpt|claude|openai|automation|llm|prompt/.test(source)) return 'AI'
  if (/travel|hotel|flight|airbnb|trip|destination/.test(source)) return 'Travel'
  if (/health|fitness|gym|wellness|supplement|workout/.test(source)) return 'Health & Fitness'
  return 'Tech & Apps'
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const category = classifyPortfolioItem(item)
  const platformLabel = formatPlatform(item.platform)
  const caption = item.caption?.trim() || `${category} portfolio piece`

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#e8e8e4] bg-white shadow-sm shadow-black/[0.03] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/[0.06]">
      <div className="relative aspect-[9/16] bg-[#1c1c1e]">
        {item.type === 'video' && isMuxId(item.url) ? (
          <VideoThumbnail
            muxPlaybackId={item.url}
            title={caption}
            subtitle={platformLabel}
            badge={category}
            aspectRatio="9/16"
            className="h-full w-full"
            rounded="rounded-none"
          />
        ) : item.thumbnail_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail_url} alt={caption} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/10" />
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#363535]">
                {category}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-sm font-semibold text-white line-clamp-2">{caption}</p>
              <p className="text-xs text-white/75 mt-1">{platformLabel}</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1c1e] text-white">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-xl">▶</div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Portfolio clip</p>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="rounded-full bg-[#f5f5f2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">
            {category}
          </span>
          <span className="text-xs text-[#9a9a9a]">{formatDate(item.created_at)}</span>
        </div>
        <p className="text-sm font-semibold text-[#363535] leading-snug line-clamp-2">{caption}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#6b6b6b]">
          <span>{platformLabel}</span>
          {item.views_count > 0 ? <span>{item.views_count.toLocaleString()} views</span> : <span>Newest first</span>}
        </div>
      </div>
    </article>
  )
}

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string
  const [creator, setCreator] = useState<CreatorFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<(typeof PORTFOLIO_TABS)[number]>('All')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        setUserRole(data?.role || null)
      }

      const { data: creator, error } = await supabase
        .from('creators')
        .select(`
          *,
          creator_socials(*),
          creator_tags(*),
          portfolio_items(*)
        `)
        .eq('id', creatorId)
        .single()

      if (error || !creator) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const sorted = {
        ...creator,
        portfolio_items: (creator.portfolio_items || []).sort((a: PortfolioItem, b: PortfolioItem) => {
          const aDate = new Date(a.created_at).getTime()
          const bDate = new Date(b.created_at).getTime()
          return bDate - aDate
        }),
      }

      setCreator(sorted)
      setLoading(false)
    }

    load()
  }, [creatorId, supabase])

  const portfolio = creator?.portfolio_items || []
  const socials = creator?.creator_socials || []
  const tags = creator?.creator_tags || []

  const skills = tags
    .map((t) => t.tag)
    .filter((tag) => tag.startsWith('skill:'))
    .map((tag) => tag.replace('skill:', '').trim())

  const portfolioCounts = useMemo(() => {
    const counts: Record<string, number> = { All: portfolio.length }
    for (const tab of PORTFOLIO_TABS.slice(1)) counts[tab] = 0
    for (const item of portfolio) {
      counts[classifyPortfolioItem(item)] = (counts[classifyPortfolioItem(item)] || 0) + 1
    }
    return counts
  }, [portfolio])

  const filteredPortfolio = useMemo(() => {
    if (activeTab === 'All') return portfolio
    return portfolio.filter((item) => classifyPortfolioItem(item) === activeTab)
  }, [activeTab, portfolio])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔍</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-3px', color: '#363535' }} className="mb-3 font-display">
            Creator not found
          </h1>
          <p className="text-[#6b6b6b] mb-8">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/explore" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            Browse creators →
          </Link>
        </div>
      </div>
    )
  }

  const experience = tags
    .map((t) => t.tag)
    .find((tag) => tag.startsWith('exp:'))
    ?.replace('exp:', '')
    .trim()

  const isCurrentUser = currentUser?.id === creator.user_id

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-1px', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <Link href="/dashboard" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
          )}
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <section className="card mb-8 overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] items-start">
            <div>
              <div className="flex items-start gap-5 mb-6">
                {creator.avatar_url ? (
                  <div className="w-24 h-24 rounded-[28px] overflow-hidden border border-[#e8e8e4] bg-[#f0f0ec] flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-[28px] bg-[#f0f0ec] border border-[#e8e8e4] flex items-center justify-center text-3xl font-semibold text-[#9a9a9a] flex-shrink-0">
                    {creator.display_name?.[0] || '?'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="font-display text-[#363535]" style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 0.98, letterSpacing: '-2.5px' }}>
                      {creator.display_name}
                    </h1>
                    {creator.is_verified && (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ccff00]" title="Verified">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                      </span>
                    )}
                  </div>
                  {creator.headline && <p className="text-base text-[#6b6b6b] leading-relaxed max-w-2xl">{creator.headline}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-[#6b6b6b]">
                    {creator.location && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f2] px-3 py-1.5"><MapPin size={12} /> {creator.location}</span>}
                    {creator.hourly_rate && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f2] px-3 py-1.5"><PoundSterling size={12} /> £{creator.hourly_rate}/video</span>}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f2] px-3 py-1.5"><Calendar size={12} /> Joined {formatDate(creator.created_at)}</span>
                    {creator.profile_views > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f2] px-3 py-1.5">{creator.profile_views} profile views</span>}
                  </div>
                </div>
              </div>

              {creator.bio && (
                <div className="rounded-[24px] border border-[#f0f0ec] bg-[#fcfcfb] p-5 mb-5">
                  <p className="section-label mb-2">Why brands book them</p>
                  <p className="text-sm leading-7 text-[#5f5f5a]">{creator.bio}</p>
                </div>
              )}

              {(skills.length > 0 || experience) && (
                <div className="space-y-4">
                  {skills.length > 0 && (
                    <div>
                      <p className="section-label mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center rounded-full bg-[#f0f0ec] px-3 py-1.5 text-xs font-medium text-[#363535]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {experience && (
                    <div>
                      <p className="section-label mb-2">Experience</p>
                      <p className="text-sm text-[#6b6b6b] leading-relaxed">{experience}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#e8e8e4] bg-[#fcfcfb] p-5">
                <p className="section-label mb-2">Portfolio at a glance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#f0f0ec] bg-white px-4 py-4">
                    <p className="text-xs text-[#9a9a9a]">Videos</p>
                    <p className="mt-1 text-2xl font-semibold text-[#363535]">{portfolio.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[#f0f0ec] bg-white px-4 py-4">
                    <p className="text-xs text-[#9a9a9a]">Categories</p>
                    <p className="mt-1 text-2xl font-semibold text-[#363535]">{Object.values(portfolioCounts).filter((count, index) => index > 0 && count > 0).length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e8e8e4] bg-[#fcfcfb] p-5">
                <p className="section-label mb-2">Links</p>
                <div className="flex flex-wrap gap-2">
                  {socials.length > 0 ? socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-transform hover:-translate-y-0.5 ${socialColors[social.platform] || 'bg-[#f0f0ec] text-[#6b6b6b]'}`}
                    >
                      <span>{socialLabels[social.platform] || social.platform}</span>
                      <ExternalLink size={11} />
                    </a>
                  )) : <p className="text-sm text-[#9a9a9a]">No public links added yet.</p>}
                </div>
              </div>

              {(userRole === 'brand' && !isCurrentUser) && (
                <Link href={`/jobs/new?invite=${creator.id}`} className="btn-primary w-full justify-center text-sm">
                  Invite to brief →
                </Link>
              )}
              {isCurrentUser && (
                <Link href="/profile/edit" className="btn-ghost w-full justify-center text-sm border border-[#e8e8e4]">
                  Edit profile →
                </Link>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
            <div>
              <p className="section-label mb-2">Portfolio</p>
              <h2 className="font-display text-[#363535]" style={{ fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.0, letterSpacing: '-1.5px' }}>
                A cleaner way to show real work
              </h2>
              <p className="text-sm text-[#6b6b6b] mt-2">Newest work first, organised into the categories brands care about most.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e8e8e4] px-3 py-1.5 text-xs text-[#6b6b6b]">
              <Sparkles size={12} /> {filteredPortfolio.length} piece{filteredPortfolio.length !== 1 ? 's' : ''} in {activeTab}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {PORTFOLIO_TABS.map((tab) => {
              const active = activeTab === tab
              const count = portfolioCounts[tab] || 0
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${active ? 'bg-[#1c1c1e] text-white shadow-lg shadow-black/[0.08]' : 'bg-white text-[#6b6b6b] border border-[#e8e8e4] hover:border-[#d7d7d1] hover:text-[#363535]'}`}
                >
                  <span>{tab}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? 'bg-white/15 text-white' : 'bg-[#f0f0ec] text-[#9a9a9a]'}`}>{count}</span>
                </button>
              )
            })}
          </div>

          {filteredPortfolio.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPortfolio.map((item) => (
                <PortfolioCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="card py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f0ec] text-2xl">🎬</div>
              <h3 className="font-display text-[#363535] mb-2" style={{ fontSize: '24px', lineHeight: 1.0, letterSpacing: '-1px' }}>
                No portfolio pieces in this category yet
              </h3>
              <p className="text-sm text-[#6b6b6b]">Switch tabs or check back after more work gets uploaded.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
