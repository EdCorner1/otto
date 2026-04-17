'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type CreatorProfile = {
  id: string; display_name: string; headline: string; bio: string
  location: string; availability: string; avatar_url?: string
  hourly_rate?: string; skills?: string[]
  creator_socials?: { platform: string; url: string }[]
  user_id: string; created_at: string
}

type Job = {
  id: string; title: string; platforms: string[]
  budget_range: string; created_at: string; status: string
}

type Application = {
  id: string; job_id: string; status: string; created_at: string
  jobs: { id: string; title: string; platforms: string[]; budget_range: string; created_at: string; status: string; brands?: { company_name: string } }
}

type PortfolioItem = {
  id: string; type: string; url: string; caption?: string
}

const platformIcons: Record<string, string> = {
  'Instagram': '📸', 'TikTok': '🎵', 'YouTube': '▶️',
  'Twitter/X': '✖', 'LinkedIn': '💼', 'Website': '🔗',
}

function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item: PortfolioItem) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#f0f0ec] group">
            {item.type === 'video' ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${extractYTId(item.url)}/hqdefault.jpg`}
                  alt={item.caption || 'Video'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
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
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-xs text-white leading-snug line-clamp-2">{item.caption}</p>
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

function extractYTId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : ''
}

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])

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

      const [{ data: appsData }, { data: portfolioData }] = await Promise.all([
        supabase
          .from('applications')
          .select('jobs(id, title, platforms, budget_range, created_at, status)')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('portfolio_items')
          .select('*')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: true }),
      ])

      const jobsRaw = (appsData || []).map((a: { jobs: unknown }) => a.jobs).filter(Boolean)
      const jobs = (jobsRaw as unknown as Job[][]).flat()
      setRecentJobs(jobs)
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
    <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
      <h1 style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#363535' }} className="mb-3">Creator not found</h1>
      <p className="text-[#6b6b6b] mb-6">This profile doesn&apos;t exist or has been removed.</p>
      <Link href="/creators" className="btn-primary inline-block">Browse creators</Link>
    </div>
  )

  const socials = creator.creator_socials || []
  const skills = creator.skills || []
  const availabilityLabel = creator.availability === 'open' ? 'Available now' : creator.availability === 'limited' ? 'Limited availability' : 'Not available'

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Back */}
      <div className="mb-6">
        <Link href="/creators" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5">
          ← Back to creators
        </Link>
      </div>

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
                <span className="text-xs text-[#6b6b6b]">£{creator.hourly_rate}/video</span>
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
      {portfolio.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e' }}>Portfolio</h2>
            <span className="text-xs text-[#9a9a9a]">{portfolio.length} item{portfolio.length !== 1 ? 's' : ''}</span>
          </div>
          <PortfolioGrid items={portfolio} />
        </div>
      )}

      {/* Recent activity */}
      {recentJobs.length > 0 && (
        <div className="card mb-5">
          <h2 style={{ fontSize: '16px', letterSpacing: '-0.5px', color: '#1c1c1e' }} className="mb-3">Recent activity</h2>
          <div className="space-y-3">
            {recentJobs.map((job: Job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-[#fafaf9] rounded-xl hover:bg-[#f0f0ec] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#363535] truncate">{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {job.platforms?.slice(0, 2).map(p => (
                      <span key={p} className="text-xs text-[#9a9a9a]">{p}</span>
                    ))}
                    {job.budget_range && (
                      <span className="text-xs text-[#9a9a9a]">· {job.budget_range}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[#9a9a9a] capitalize flex-shrink-0">{job.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center">
        <Link href="/jobs" className="btn-primary inline-block">
          View open jobs →
        </Link>
      </div>

    </div>
  )
}
