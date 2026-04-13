'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type CreatorProfile = {
  id: string; display_name: string; headline: string; bio: string
  location: string; availability: string; avatar_url?: string
  hourly_rate?: string; skills?: string[]
  creator_socials?: { platform: string; url: string }[]
}

type PortfolioItem = {
  id: string; type: string; url: string; caption?: string
}

const platformIcons: Record<string, string> = {
  'Instagram': '📸', 'TikTok': '🎵', 'YouTube': '▶️',
  'Twitter/X': '✖', 'LinkedIn': '💼', 'Website': '🔗',
}

function VideoThumb({ item }: { item: PortfolioItem }) {
  return (
    <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#f0f0ec] group">
      {item.type === 'video' ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${extractYTId(item.url)}/hqdefault.jpg`}
            alt={item.caption || 'Video'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
      )}
      {item.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-xs text-white leading-snug line-clamp-2">{item.caption}</p>
        </div>
      )}
    </div>
  )
}

function extractYTId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : ''
}

export default function PublicCreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string
  const supabase = createClient()
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('*, creator_socials(*)')
        .eq('id', creatorId)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setCreator(data as CreatorProfile)

      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: true })

      setPortfolio((portfolioData as PortfolioItem[]) || [])
      setLoading(false)
    }
    load()
  }, [creatorId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !creator) return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#363535' }} className="mb-3">Creator not found</h1>
        <p className="text-[#6b6b6b] mb-6">This profile doesn&apos;t exist or has been removed.</p>
        <Link href="/creators" className="btn-primary inline-block">Browse creators</Link>
      </div>
    </div>
  )

  const socials = creator.creator_socials || []
  const skills = creator.skills || []
  const availabilityLabel = creator.availability === 'open' ? 'Available now' : creator.availability === 'limited' ? 'Limited availability' : 'Not available'
  const hasPortfolio = portfolio.length > 0

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Minimal nav */}
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/creators" className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>
            Otto
          </span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="btn-primary text-xs px-4 py-2">
            Find work →
          </Link>
        </div>
      </header>

      <main className="pt-28 pb-20 max-w-3xl mx-auto px-6">

        {/* Profile header */}
        <div className="card mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#e8e8e4] flex-shrink-0 bg-[#f0f0ec]">
              {creator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#9a9a9a]">
                  {creator.display_name?.[0] ?? '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', letterSpacing: '-0.5px', color: '#1c1c1e' }} className="mb-1">
                {creator.display_name}
              </h1>
              {creator.headline && (
                <p className="text-sm text-[#6b6b6b] mb-2">{creator.headline}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${creator.availability === 'open' ? 'bg-green-100 text-green-700' : creator.availability === 'limited' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {availabilityLabel}
                </span>
                {creator.hourly_rate && (
                  <span className="text-xs text-[#6b6b6b]">{creator.hourly_rate}/hr</span>
                )}
                {creator.location && (
                  <span className="text-xs text-[#6b6b6b]">{creator.location}</span>
                )}
              </div>
            </div>
          </div>

          {creator.bio && (
            <p className="text-sm text-[#6b6b6b] whitespace-pre-wrap leading-relaxed mb-4">{creator.bio}</p>
          )}

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill: string) => (
                <span key={skill} className="text-xs px-2.5 py-1 bg-[#f0f0ec] text-[#363535] rounded-full font-medium">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socials.map((social: { platform: string; url: string }) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#f0f0ec] hover:bg-[#e8e8e4] rounded-full text-[#6b6b6b] transition-colors capitalize"
                >
                  <span>{platformIcons[social.platform] || '🔗'}</span>
                  {social.platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio */}
        {hasPortfolio ? (
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e' }}>
                Portfolio
              </h2>
              <span className="text-xs text-[#9a9a9a]">{portfolio.length} item{portfolio.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolio.map((item: PortfolioItem) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <VideoThumb item={item} />
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="card mb-5 text-center py-10">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-sm text-[#9a9a9a]">No portfolio items yet</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-[#6b6b6b] mb-3">Want to work with {creator.display_name}?</p>
          <Link href="/jobs" className="btn-primary inline-block">
            View open briefs →
          </Link>
        </div>

      </main>
    </div>
  )
}
