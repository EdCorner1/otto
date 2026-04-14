'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Creator = {
  id: string; display_name: string; headline: string; bio: string
  skills: string[]; location: string; availability: string
  avatar_url: string; creator_socials: { platform: string; url: string }[]
  creator_tags?: { tag: string }[]
  hourly_rate: string; user_id: string
}

const PLATFORM_FILTERS = ['All', 'TikTok', 'Instagram', 'YouTube Shorts', 'LinkedIn']
const NICHE_FILTERS = ['All', 'SaaS & AI', 'Hardware & Gadgets', 'Fintech', 'Consumer Tech', 'Travel & Lifestyle']
const AUDIENCE_FILTERS = ['All', 'B2B', 'B2C']

export default function CreatorsDiscoverPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('All')
  const [niche, setNiche] = useState('All')
  const [audience, setAudience] = useState('All')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from('creators')
        .select('*, creator_socials(*), creator_tags(*)')
        .order('created_at', { ascending: false })

      const normalized = ((data as Creator[]) || []).map((c) => {
        const skillTags = (c.creator_tags || [])
          .map(t => t.tag)
          .filter(tag => tag.startsWith('skill:'))
          .map(tag => tag.replace('skill:', '').trim())
        return { ...c, skills: c.skills?.length ? c.skills : skillTags }
      })

      setCreators(normalized)
      setLoading(false)
    }
    getUser()
  }, [])

  const filtered = useMemo(() => {
    return creators.filter(c => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        c.display_name?.toLowerCase().includes(q) ||
        c.headline?.toLowerCase().includes(q) ||
        c.skills?.some((s: string) => s.toLowerCase().includes(q)) ||
        c.bio?.toLowerCase().includes(q)

      const platformMatch =
        platform === 'All' ||
        c.creator_socials?.some((s: { platform: string }) =>
          s.platform.toLowerCase() === platform.toLowerCase()
        )

      const nicheMap: Record<string, string[]> = {
        'SaaS & AI': ['saas', 'ai', 'productivity', 'software', 'no-code', 'automation', 'chatgpt', 'cursor'],
        'Hardware & Gadgets': ['hardware', 'gadget', 'electronics', 'smart home', 'wearable', 'audio'],
        'Fintech': ['fintech', 'banking', 'crypto', 'payments', 'trading', 'budgeting'],
        'Consumer Tech': ['consumer', 'smartphone', 'laptop', 'tablet', 'gaming', 'camera'],
        'Travel & Lifestyle': ['travel', 'lifestyle', 'fitness', 'health', 'wellness', 'outdoor'],
      }

      const nicheMatch =
        niche === 'All' ||
        (nicheMap[niche] || []).some((n: string) =>
          c.skills?.some((s: string) => s.toLowerCase().includes(n)) ||
          c.headline?.toLowerCase().includes(n) ||
          c.bio?.toLowerCase().includes(n)
        )

      const b2bSkills = ['b2b', 'saas', 'fintech', 'enterprise', 'b2b', 'linkedin', 'professional']
      const b2bMatch =
        audience === 'All' ||
        (audience === 'B2B' && c.skills?.some((s: string) => b2bSkills.includes(s.toLowerCase()))) ||
        (audience === 'B2C' && !c.skills?.some((s: string) => b2bSkills.includes(s.toLowerCase())))

      return matchesSearch && platformMatch && nicheMatch && b2bMatch
    })
  }, [creators, search, platform, niche, audience])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6">

      {/* Header */}
      <div className="mb-8">
        <h1 style={{
          fontFamily: 'var(--font-bricolage)',
          fontWeight: 600, fontSize: 'clamp(28px, 5vw, 40px)',
          lineHeight: 1.0, letterSpacing: '-0.5px', color: '#363535',
        }} className="mb-2">
          Discover creators
        </h1>
        <p className="text-sm text-[#6b6b6b]">
          Vetted tech UGC creators — filtered by platform, niche, and audience.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, or niche..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#363535]
            placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-8">

        {/* Platform */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-[#9a9a9a] w-16 flex-shrink-0">Platform</span>
          <div className="flex gap-2 flex-wrap">
            {PLATFORM_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setPlatform(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  platform === f
                    ? 'bg-[#1c1c1e] text-white'
                    : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Niche */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-[#9a9a9a] w-16 flex-shrink-0">Niche</span>
          <div className="flex gap-2 flex-wrap">
            {NICHE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setNiche(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  niche === f
                    ? 'bg-[#1c1c1e] text-white'
                    : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-[#9a9a9a] w-16 flex-shrink-0">Audience</span>
          <div className="flex gap-2 flex-wrap">
            {AUDIENCE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setAudience(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  audience === f
                    ? 'bg-[#1c1c1e] text-white'
                    : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {(platform !== 'All' || niche !== 'All' || audience !== 'All' || search) && (
          <p className="text-xs text-[#9a9a9a] pl-[72px]">
            {filtered.length} creator{filtered.length !== 1 ? 's' : ''} match your filters
          </p>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-[#6b6b6b]">No creators match your filters.</p>
          <button
            onClick={() => { setPlatform('All'); setNiche('All'); setAudience('All'); setSearch('') }}
            className="mt-3 text-xs text-[#363535] underline hover:text-[#1c1c1e]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(creator => (
            <CreatorCard key={creator.id} creator={creator} currentUserId={user?.id} />
          ))}
        </div>
      )}

    </div>
  )
}

function CreatorCard({ creator, currentUserId }: { creator: Creator; currentUserId?: string }) {
  const isOwn = creator.user_id === currentUserId
  const socials = creator.creator_socials || []

  return (
    <div className="card card-hover p-5 flex gap-4">
      {/* Avatar */}
      {creator.avatar_url ? (
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#e8e8e4] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-lg font-bold text-[#9a9a9a] flex-shrink-0">
          {creator.display_name?.[0] ?? '?'}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '16px', color: '#1c1c1e' }}
            className="truncate">
            {creator.display_name || 'Unnamed creator'}
          </p>
          {creator.availability === 'open' && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">Available</span>
          )}
        </div>

        {creator.headline && (
          <p className="text-xs text-[#6b6b6b] mb-2 line-clamp-2">{creator.headline}</p>
        )}

        {creator.skills && creator.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {creator.skills.slice(0, 3).map((s: string) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-[#f0f0ec] rounded-full text-[#6b6b6b]">{s}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          {isOwn ? (
            <Link href="/profile/edit" className="btn-ghost text-xs py-1.5 px-3">Edit profile →</Link>
          ) : (
            <>
              <Link href={`/creators/${creator.id}`} className="btn-ghost text-xs py-1.5 px-3">View →</Link>
              {socials.slice(0, 2).map(s => (
                <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs py-1.5 px-2 bg-[#f0f0ec] rounded-full text-[#6b6b6b] hover:text-[#363535] transition-colors capitalize">
                  {s.platform}
                </a>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
