'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Brand = {
  id: string; user_id: string; company_name: string; website: string | null; logo_url: string | null;
  bio: string | null; industry: string | null; subscription_tier: string; subscription_status: string;
  stripe_customer_id: string | null; created_at: string; updated_at: string;
}
type Job = {
  id: string; brand_id: string; title: string; description: string; deliverables: string | null;
  platforms: string[]; niche_tags: string[]; budget_min: string | null; budget_max: string | null;
  deadline: string | null; status: string; proposal_count: number; created_at: string; updated_at: string;
}
type BrandFull = Brand & { jobs: Job[] }

const industryIcons: Record<string, string> = {
  'Tech': '💻', 'SaaS': '☁️', 'AI Tools': '🤖', 'Gadgets': '📱',
  'Gaming': '🎮', 'Other': '🔷',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function JobCard({ job }: { job: Job }) {
  const platforms: Record<string, string> = {
    tiktok: '🎵', youtube: '▶️', instagram: '📸', twitter: '🐦', other: '🔗',
  }
  const platformList = (job.platforms as string[] || []).slice(0, 4)

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block card hover:-translate-y-0.5 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-[#363535] text-sm leading-snug group-hover:text-[#1c1c1c]">
          {job.title}
        </h3>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
          job.status === 'open' ? 'bg-green-50 text-green-700' :
          job.status === 'filled' ? 'bg-blue-50 text-blue-600' :
          job.status === 'paused' ? 'bg-amber-50 text-amber-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {job.status}
        </span>
      </div>

      <p className="text-xs text-[#6b6b6b] line-clamp-2 mb-3">{job.description}</p>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Platforms */}
        {platformList.length > 0 && (
          <div className="flex items-center gap-1">
            {platformList.map(p => (
              <span key={p} className="text-sm" title={p}>{platforms[p] || '🔗'}</span>
            ))}
          </div>
        )}
        {/* Budget */}
        {(job.budget_min || job.budget_max) && (
          <span className="text-xs font-semibold text-[#363535]">
            £{job.budget_min || job.budget_max}{job.budget_max ? `–${job.budget_max}` : ''}
          </span>
        )}
        {/* Proposals */}
        {typeof job.proposal_count === 'number' && (
          <span className="text-xs text-[#9a9a9a]">{job.proposal_count} proposals</span>
        )}
      </div>
    </Link>
  )
}

export default function BrandProfilePage() {
  const params = useParams()
  const brandId = params.id as string
  const [brand, setBrand] = useState<BrandFull | null>(null)
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

      const { data: brandData, error } = await supabase
        .from('brands')
        .select(`
          *,
          jobs(*)
        `)
        .eq('id', brandId)
        .single()

      if (error || !brandData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Only show open/paused jobs on public profile
      const visibleJobs = (brandData.jobs || []).filter((j: Job) => ['open', 'paused'].includes(j.status))
      setBrand({ ...brandData, jobs: visibleJobs })
      setLoading(false)
    }
    load()
  }, [brandId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !brand) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-6">🏢</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.0, letterSpacing: '-4.5px', color: '#363535' }} className="mb-3">
            Brand not found
          </h1>
          <p className="text-[#6b6b6b] mb-8">This brand profile doesn&apos;t exist or has been removed.</p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const openJobs = brand.jobs?.filter(j => j.status === 'open') || []
  const isCurrentUser = currentUser?.id === brand.user_id

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
              <Link href="/jobs" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Browse Briefs</Link>
            </>
          ) : (
            <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
          )}
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        {/* Brand header */}
        <div className="card mb-8">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="flex-shrink-0">
              {brand.logo_url ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#e8e8e4] bg-white flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brand.logo_url} alt={brand.company_name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-3xl">
                  {industryIcons[brand.industry || 'Other'] || '🏢'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1
                style={{ fontSize: 'clamp(24px, 4vw, 32px)', lineHeight: 1.0, letterSpacing: '-2px', color: '#363535' }}
                className="truncate"
              >
                {brand.company_name}
              </h1>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {brand.industry && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#6b6b6b]">
                    {industryIcons[brand.industry] || '🔷'} {brand.industry}
                  </span>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#363535] hover:text-[#1c1c1c] underline underline-offset-2"
                  >
                    🌐 {brand.website.replace(/^https?:\/\//, '')}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
                <span className="text-xs text-[#9a9a9a]">📅 Joined {formatDate(brand.created_at)}</span>
              </div>

              {/* Subscription tier */}
              {brand.subscription_tier && brand.subscription_tier !== 'free' && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ccff00] rounded-full text-xs font-bold text-[#1c1c1c]">
                    {brand.subscription_tier.charAt(0).toUpperCase() + brand.subscription_tier.slice(1)} Brand
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {brand.bio && (
            <p className="mt-5 text-sm text-[#6b6b6b] leading-relaxed border-t border-[#e8e8e4] pt-4">
              {brand.bio}
            </p>
          )}

          {/* CTA */}
          {userRole === 'creator' && !isCurrentUser && (
            <div className="mt-5 pt-4 border-t border-[#e8e8e4]">
              <Link
                href="/jobs"
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                View Open Briefs
              </Link>
            </div>
          )}

          {isCurrentUser && (
            <div className="mt-5 pt-4 border-t border-[#e8e8e4] flex gap-3">
              <Link href="/jobs/new" className="btn-primary text-sm inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Post New Brief
              </Link>
              <Link href="/dashboard" className="btn-ghost text-sm inline-flex items-center gap-2">
                Edit Profile
              </Link>
            </div>
          )}
        </div>

        {/* Open briefs */}
        {openJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{ fontSize: 'clamp(18px, 3vw, 22px)', lineHeight: 1.0, letterSpacing: '-1.5px', color: '#363535' }}
              >
                Open Briefs
              </h2>
              <span className="text-xs text-[#9a9a9a]">{openJobs.length} active</span>
            </div>
            <div className="space-y-3">
              {openJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {openJobs.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-[#6b6b6b]">No open briefs right now.</p>
            {isCurrentUser && (
              <Link href="/jobs/new" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                Post a Brief
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
