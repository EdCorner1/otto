'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Creator = {
  id: string; display_name: string; headline: string; bio: string
  skills: string[]; location: string; availability: string
  avatar_url: string; creator_socials: { platform: string; url: string }[]
  hourly_rate: string; user_id: string
}

export default function CreatorsDiscoverPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from('creators').select('*').order('created_at', { ascending: false })
      setCreators((data as Creator[]) || [])
      setLoading(false)
    }
    getUser()
  }, [])

  const filtered = creators.filter(c => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.display_name?.toLowerCase().includes(q) ||
      c.headline?.toLowerCase().includes(q) ||
      c.skills?.some((s: string) => s.toLowerCase().includes(q))
    )
  })

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
          lineHeight: 1.0, letterSpacing: '-2px', color: '#363535',
        }} className="mb-2">
          Discover creators
        </h1>
        <p className="text-sm text-[#6b6b6b]">
          Find the right creator for your next campaign.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-[#6b6b6b]">No creators match your search.</p>
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
