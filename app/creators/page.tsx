'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Creator = {
  id: string; display_name: string; avatar_url: string | null
  headline: string | null; bio: string | null; location: string | null
  hourly_rate: string | null; availability: string; is_verified: boolean
  profile_views: number; created_at: string
  creator_socials: { id?: string; platform: string; url: string }[]
  portfolio_items: { id: string; type: string; thumbnail_url: string | null }[]
}

const platformIcons: Record<string, string> = {
  tiktok: '🎵', youtube: '▶️', instagram: '📸', twitter: '🐦', other: '🔗',
}

function CreatorCard({ creator, userRole }: { creator: Creator; userRole: string | null }) {
  const socials = creator.creator_socials || []
  const portfolio = (creator.portfolio_items || []).slice(0, 4)
  const isOpen = creator.availability === 'open'

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col">

      {/* Portfolio preview */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-2 gap-0.5 aspect-video bg-[#f0f0ec]">
          {portfolio.map(item => (
            <div key={item.id} className="bg-[#1c1c1c] relative">
              {item.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80" />
              ) : item.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/60 text-xl">▶️</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-xl">🖼️</div>
              )}
            </div>
          ))}
          {portfolio.length < 4 && Array.from({ length: 4 - portfolio.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-[#f0f0ec]" />
          ))}
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            {creator.avatar_url ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#e8e8e4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-lg">
                {creator.display_name?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-[#363535] truncate">{creator.display_name}</p>
              {creator.is_verified && (
                <span className="w-4 h-4 bg-[#ccff00] rounded-full flex items-center justify-center flex-shrink-0" title="Verified">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="3.5"><polyline points="20,6 9,17 4,12" /></svg>
                </span>
              )}
            </div>
            {creator.headline && (
              <p className="text-xs text-[#6b6b6b] line-clamp-1 mt-0.5">{creator.headline}</p>
            )}
          </div>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
            {creator.availability || 'open'}
          </span>
        </div>

        {/* Social links */}
        {socials.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {socials.slice(0, 5).map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-[#f0f0ec] flex items-center justify-center text-xs hover:bg-[#e8e8e4] transition-colors"
                title={s.platform}>
                {platformIcons[s.platform] || '🔗'}
              </a>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[#9a9a9a] mb-4 flex-wrap">
          {creator.location && <span>📍 {creator.location}</span>}
          {creator.hourly_rate && <span>💷 £{creator.hourly_rate}/hr</span>}
          {creator.profile_views > 0 && <span>👁 {creator.profile_views}</span>}
        </div>

        {/* CTA */}
        <div className="mt-auto flex gap-2">
          <Link href={`/creators/${creator.id}`} className="flex-1 btn-ghost text-xs text-center py-2">
            View Profile
          </Link>
          {userRole === 'brand' && (
            <Link href={`/jobs/new?invite=${creator.id}`} className="flex-1 btn-primary text-xs text-center py-2">
              Invite
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [availability, setAvailability] = useState<string>('all')
  const router = useRouter()
  const supabase = createClient()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Load creators
  const loadCreators = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('creators')
      .select(`*, creator_socials(*), portfolio_items(id, type, thumbnail_url)`)
      .order('profile_views', { ascending: false })
      .limit(30)

    if (debouncedSearch) {
      query = query.or(`display_name.ilike.%${debouncedSearch}%,headline.ilike.%${debouncedSearch}%,bio.ilike.%${debouncedSearch}%`)
    }
    if (availability !== 'all') {
      query = query.eq('availability', availability)
    }

    const { data } = await query
    setCreators((data as Creator[]) || [])
    setLoading(false)
  }, [debouncedSearch, availability])

  useEffect(() => {
    loadCreators()
  }, [loadCreators])

  // Get user role
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        setUserRole(data?.role || null)
      }
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>
            Otto<span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sm text-[#6b6b6b] hover:text-[#363535]">Blog</Link>
            <Link href="/dashboard" className="text-sm text-[#6b6b6b] hover:text-[#363535]">Dashboard</Link>
            <Link href="/login" className="btn-primary text-sm py-2 px-4">Sign in</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.0, letterSpacing: '-3px', color: '#363535' }} className="mb-2">
            Discover Creators
          </h1>
          <p className="text-[#6b6b6b]">Find tech creators ready to work with your brand.</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9a9a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, specialty, or niche..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            />
          </div>
          <select
            value={availability}
            onChange={e => setAvailability(e.target.value)}
            className="px-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
          >
            <option value="all">All availability</option>
            <option value="open">Open to work</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-[#9a9a9a] mb-5">{creators.length} creator{creators.length !== 1 ? 's' : ''} found</p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white border border-[#e8e8e4] rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-[#6b6b6b] mb-2">No creators found.</p>
            <p className="text-sm text-[#9a9a9a]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {creators.map(creator => (
              <CreatorCard key={creator.id} creator={creator} userRole={userRole} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
