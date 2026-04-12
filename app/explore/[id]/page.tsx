'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Social = { id: string; creator_id: string; platform: string; url: string }
type PortfolioItem = { id: string; creator_id: string; type: string; url: string; thumbnail_url: string | null; caption: string | null; platform: string | null; views_count: number; sort_order: number; created_at: string }
type Creator = {
  id: string; user_id: string; display_name: string; avatar_url: string | null; bio: string | null;
  location: string | null; timezone: string | null; hourly_rate: string | null;
  availability: string; is_verified: boolean; is_pro: boolean; profile_views: number;
  headline?: string; website?: string; created_at: string; updated_at: string;
}
type CreatorFull = Creator & {
  creator_socials: Social[]
  portfolio_items: PortfolioItem[]
}

const platformIcons: Record<string, string> = {
  tiktok: '●',
  youtube: '●',
  instagram: '●',
  twitter: '●',
  other: '●',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (!items.length) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-xl overflow-hidden bg-[#f0f0ec] group cursor-pointer border border-[#e8e8e4]"
        >
          {item.type === 'video' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1c1c1c]">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl ml-0.5">▶️</span>
              </div>
              {item.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}
            </div>
          ) : (
            item.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnail_url} alt={item.caption || ''} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl">🖼️</div>
            )
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#1c1c1c]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
            {item.caption && <p className="text-white text-xs text-center line-clamp-3">{item.caption}</p>}
            {item.platform && <span className="mt-2 text-white text-xs">{platformIcons[item.platform] || ''} {item.platform}</span>}
          </div>
        </div>
      ))}
    </div>
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
          portfolio_items(*)
        `)
        .eq('id', creatorId)
        .single()

      if (error || !creator) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Sort portfolio by sort_order, then created_at
      const sorted = {
        ...creator,
        portfolio_items: (creator.portfolio_items || []).sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order || 0) - (b.sort_order || 0)),
      }
      setCreator(sorted)
      setLoading(false)
    }
    load()
  }, [creatorId])

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
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }} className="mb-3">
            Creator not found
          </h1>
          <p className="text-[#6b6b6b] mb-8">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const socials = creator.creator_socials || []
  const portfolio = creator.portfolio_items || []
  const isCurrentUser = currentUser?.id === creator.user_id

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <Link href="/dashboard" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Dashboard</Link>
              <Link href="/messages" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Messages</Link>
            </>
          ) : (
            <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
          )}
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        {/* Profile header */}
        <div className="card mb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {creator.avatar_url ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#e8e8e4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-3xl">
                  {creator.display_name?.[0] || '?'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1
                    style={{ fontSize: 'clamp(24px, 4vw, 32px)', lineHeight: 1.0, letterSpacing: '-2px', color: '#363535' }}
                    className="truncate"
                  >
                    {creator.display_name}
                  </h1>
                  {creator.headline && (
                    <p className="text-sm text-[#6b6b6b] mt-1 leading-snug">{creator.headline}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Availability badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    creator.availability === 'open' ? 'bg-green-50 text-green-700' :
                    creator.availability === 'limited' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      creator.availability === 'open' ? 'bg-green-500' :
                      creator.availability === 'limited' ? 'bg-amber-500' :
                      'bg-gray-400'
                    }`} />
                    {creator.availability || 'open'}
                  </span>
                  {creator.is_verified && (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-[#ccff00] rounded-full" title="Verified">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[#6b6b6b] flex-wrap">
                {creator.location && (
                  <span className="flex items-center gap-1">📍 {creator.location}</span>
                )}
                {creator.hourly_rate && (
                  <span className="flex items-center gap-1">💷 £{creator.hourly_rate}/hr</span>
                )}
                <span className="flex items-center gap-1">📅 Joined {formatDate(creator.created_at)}</span>
                {creator.profile_views > 0 && (
                  <span className="flex items-center gap-1">👁 {creator.profile_views} views</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="mt-5 text-sm text-[#6b6b6b] leading-relaxed border-t border-[#e8e8e4] pt-4">
              {creator.bio}
            </p>
          )}

          {/* Social links */}
          {socials.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#e8e8e4]">
              <div className="flex items-center gap-2 flex-wrap">
                {socials.map((social: Social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e8e4] rounded-lg text-xs font-medium text-[#363535] hover:border-[#ccff00] hover:-translate-y-0.5 transition-all"
                  >
                    <span>●</span>
                    <span className="capitalize">{social.platform}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CTA for brands */}
          {userRole === 'brand' && !isCurrentUser && (
            <div className="mt-5 pt-4 border-t border-[#e8e8e4]">
              <Link
                href={`/jobs/new?invite=${creator.id}`}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                Invite to Brief
              </Link>
            </div>
          )}

          {isCurrentUser && (
            <div className="mt-5 pt-4 border-t border-[#e8e8e4]">
              <Link href="/dashboard" className="btn-ghost text-sm inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </Link>
            </div>
          )}
        </div>

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{ fontSize: 'clamp(18px, 3vw, 22px)', lineHeight: 1.0, letterSpacing: '-1.5px', color: '#363535' }}
              >
                Portfolio
              </h2>
              <span className="text-xs text-[#9a9a9a]">{portfolio.length} items</span>
            </div>
            <PortfolioGrid items={portfolio} />
          </div>
        )}

        {portfolio.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-sm text-[#6b6b6b]">No portfolio items yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
