'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { DEMO_JOBS } from '@/lib/demo-jobs'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-0.5px',
  color: '#363535',
}

type Role = 'brand' | 'creator' | null

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-[#ccff00]/20 text-[#363535]',
    filled: 'bg-[#e8e8e4] text-[#6b6b6b]',
    closed: 'bg-[#e8e8e4] text-[#6b6b6b]',
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-50 text-red-600',
    withdrawn: 'bg-gray-100 text-gray-500',
    proposed: 'bg-blue-50 text-blue-600',
    in_progress: 'bg-[#ccff00]/20 text-[#363535]',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    disputed: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

type Job = {
  id: string; title: string; status: string; created_at: string
  applications: { id: string }[]; budget_range?: string; deadline?: string
}

type Application = {
  id: string; job_id: string; status: string; created_at: string
  jobs: { id: string; title: string; brands: { company_name: string } }
}

type Creator = {
  id: string
  display_name: string
  headline: string
  bio?: string | null
  avatar_url?: string | null
  website?: string | null
  skills: string[]
  creator_tags?: { tag: string }[]
  creator_socials?: { platform: string; url: string }[]
  portfolio_items?: { id: string }[]
}

type Deal = {
  id: string; status: string; budget: number
  jobs: { title: string }; brands: { company_name: string }; creators: { display_name: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{
    id: string; email?: string
    user_metadata?: { role?: 'brand' | 'creator'; full_name?: string }
  } | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)
  const [posted, setPosted] = useState(searchParams.get('posted') === '1')
  const [brandJobs, setBrandJobs] = useState<Job[]>([])
  const [brandDeals, setBrandDeals] = useState<Deal[]>([])
  const [creatorApps, setCreatorApps] = useState<Application[]>([])
  const [creatorDeals, setCreatorDeals] = useState<Deal[]>([])
  const [creatorProfile, setCreatorProfile] = useState<Creator | null>(null)
  const supabase = createClient()

useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUser(user)

      let resolvedRole = (user.user_metadata?.role || null) as Role
      if (!resolvedRole) {
        const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
        resolvedRole = ((userRow?.role as Role) || null)
      }
      setRole(resolvedRole)

      if (resolvedRole === 'brand') {
        const { data: brandData } = await supabase
          .from('brands').select('id').eq('user_id', user.id).single()
        if (brandData) {
          const [{ data: jobsData }, { data: dealsData }] = await Promise.all([
            supabase.from('jobs').select('*, applications(id)')
              .eq('brand_id', brandData.id).order('created_at', { ascending: false }).limit(5),
            supabase.from('deals').select('*, jobs(title), creators(display_name), brands(company_name)')
              .eq('brand_id', brandData.id).order('created_at', { ascending: false }).limit(5),
          ])
          setBrandJobs((jobsData as Job[]) || [])
          setBrandDeals((dealsData as Deal[]) || [])
        }
      } else if (resolvedRole === 'creator') {
        const { data: creatorData } = await supabase
          .from('creators').select('*, creator_tags(tag), creator_socials(platform, url), portfolio_items(id)').eq('user_id', user.id).single()
        if (creatorData) {
          const skillTags = ((creatorData as Creator).creator_tags || [])
            .map(t => t.tag)
            .filter(tag => tag.startsWith('skill:'))
            .map(tag => tag.replace('skill:', '').trim())

          setCreatorProfile({
            ...(creatorData as Creator),
            skills: (creatorData as Creator).skills?.length ? (creatorData as Creator).skills : skillTags,
          })
          const [{ data: appsData }, { data: dealsData }] = await Promise.all([
            supabase.from('applications').select('*, jobs(id, title, brands(company_name))')
              .eq('creator_id', creatorData.id).order('created_at', { ascending: false }).limit(5),
            supabase.from('deals').select('*, jobs(title), brands(company_name), creators(display_name)')
              .eq('creator_id', creatorData.id).order('created_at', { ascending: false }).limit(5),
          ])
          setCreatorApps((appsData as Application[]) || [])
          setCreatorDeals((dealsData as Deal[]) || [])
        }
      }

      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const featuredJobs = DEMO_JOBS.slice(0, 5)

  let nextAction: { title: string; description: string; cta: string; href: string } | null = null

  if (role === 'brand') {
    if (brandJobs.length === 0) {
      nextAction = {
        title: 'Post your first brief',
        description: 'Get creator proposals by publishing a short, clear brief in under 5 minutes.',
        cta: 'Post Brief',
        href: '/jobs/new',
      }
    } else if (brandDeals.length === 0) {
      nextAction = {
        title: 'Review incoming proposals',
        description: 'You have live briefs. Shortlist creators and move one opportunity into an active deal.',
        cta: 'View My Briefs',
        href: '/jobs',
      }
    } else {
      nextAction = {
        title: 'Keep momentum in active deals',
        description: 'Reply quickly in messages to reduce cycle time and close campaigns faster.',
        cta: 'Open Messages',
        href: '/messages',
      }
    }
  }

  if (role === 'creator') {
    if (creatorApps.length === 0) {
      nextAction = {
        title: 'Apply to your first brief',
        description: 'Pick one relevant brief and send a tight proposal with your strongest portfolio example.',
        cta: 'Browse Briefs',
        href: '/jobs',
      }
    } else if (creatorDeals.length === 0) {
      nextAction = {
        title: 'Follow up on applications',
        description: 'Check statuses and stay responsive so brands can move you into paid work quickly.',
        cta: 'View Applications',
        href: '/jobs',
      }
    } else {
      nextAction = {
        title: 'Advance your active work',
        description: 'Share updates in deal messages and submit quickly to unlock approvals and payouts.',
        cta: 'Open Messages',
        href: '/messages',
      }
    }
  }

  if (!role) {
    nextAction = {
      title: 'Finish onboarding',
      description: 'Complete onboarding to unlock full dashboard actions and matched opportunities.',
      cta: 'Continue Onboarding',
      href: '/onboarding',
    }
  }

  const creatorPrimarySocialCount = (creatorProfile?.creator_socials || []).filter((social) =>
    ['tiktok', 'instagram', 'youtube'].includes(social.platform) && social.url?.trim()
  ).length
  const creatorPortfolioCount = creatorProfile?.portfolio_items?.length || 0
  const creatorChecklist = role === 'creator' ? [
    { label: 'Profile photo', done: !!creatorProfile?.avatar_url },
    { label: 'Short bio / why me', done: !!creatorProfile?.bio?.trim() },
    { label: 'Portfolio link', done: !!creatorProfile?.website?.trim() },
    { label: '1+ primary social', done: creatorPrimarySocialCount >= 1 },
    { label: '3 videos uploaded', done: creatorPortfolioCount >= 3 },
    { label: '6 videos for 100%', done: creatorPortfolioCount >= 6 },
  ] : []
  const creatorChecklistDone = creatorChecklist.filter((item) => item.done).length

  return (
    <div className="max-w-4xl mx-auto px-6">

      {/* Success banner */}
      {posted && (
        <div className="mb-6 fade-up bg-[#ccff00] text-[#1c1c1c] rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle size={16} /> Brief posted. Creators can now apply.</span>
          <button onClick={() => setPosted(false)} className="opacity-60 hover:opacity-100 ml-2 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 fade-up">
        <h1 style={headlineStyle}>Welcome back, {displayName}.</h1>
        <p className="text-[#6b6b6b] mt-2 text-sm">
          {role === 'brand' ? 'Manage your briefs and track active work.' : 'Track your applications and active deals.'}
        </p>
      </div>

      {/* Next best action */}
      {nextAction && (
        <section className="card mb-6 fade-up stagger-1">
          <p className="section-label mb-2">Next Best Action</p>
          <h2 className="text-xl font-semibold text-[#363535] mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>
            {nextAction.title}
          </h2>
          <p className="text-sm text-[#6b6b6b] mb-4">{nextAction.description}</p>
          <Link href={nextAction.href} className="btn-primary text-sm px-4 py-2">
            {nextAction.cta} →
          </Link>
        </section>
      )}

      {role === 'creator' && creatorProfile && (
        <section className="card mb-6 fade-up stagger-1">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <p className="section-label mb-2">Creator launch checklist</p>
              <h2 className="text-xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>
                Get your profile live fast
              </h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#f0f0ec] px-3 py-1 text-xs font-semibold text-[#6b6b6b]">
              {creatorChecklistDone} / {creatorChecklist.length} complete
            </span>
          </div>

          <div className="space-y-3 mb-5">
            {creatorChecklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f0ec] bg-[#fafaf9] px-4 py-3">
                <span className="text-sm text-[#363535]">{item.label}</span>
                <span className={`text-xs font-semibold ${item.done ? 'text-green-700' : 'text-[#9a9a9a]'}`}>
                  {item.done ? 'Done' : 'To do'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/profile/edit" className="btn-ghost text-sm">Edit profile</Link>
            {creatorProfile?.id && <Link href={`/explore/${creatorProfile.id}`} className="btn-primary text-sm">Preview public profile →</Link>}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-6 fade-up stagger-1">
        {role === 'brand' && (
          <Link href="/jobs/new" className="btn-primary">Post a New Brief</Link>
        )}
        {role === 'creator' && (
          <Link href="/jobs" className="btn-primary">Browse Briefs</Link>
        )}
        <Link href="/messages" className="btn-ghost">Messages</Link>
        {role === 'creator' && (
          <Link href="/profile/edit" className="btn-ghost">View my profile</Link>
        )}
      </div>

      {/* KPI cards */}
      {role === 'brand' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 fade-up stagger-1">
          <div className="card">
            <p className="text-xs text-[#9a9a9a]">Open Briefs</p>
            <p className="text-2xl font-semibold text-[#363535] mt-1">{brandJobs.filter(j => j.status === 'open').length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[#9a9a9a]">Total Proposals</p>
            <p className="text-2xl font-semibold text-[#363535] mt-1">{brandJobs.reduce((n, j) => n + (j.applications?.length || 0), 0)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[#9a9a9a]">Active Deals</p>
            <p className="text-2xl font-semibold text-[#363535] mt-1">{brandDeals.length}</p>
          </div>
        </div>
      )}

      {role === 'creator' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 fade-up stagger-1">
          <div className="card">
            <p className="text-xs text-[#9a9a9a]">Applications Sent</p>
            <p className="text-2xl font-semibold text-[#363535] mt-1">{creatorApps.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[#9a9a9a]">Active Deals</p>
            <p className="text-2xl font-semibold text-[#363535] mt-1">{creatorDeals.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[#9a9a9a]">Featured Opportunities</p>
            <p className="text-2xl font-semibold text-[#363535] mt-1">{featuredJobs.length}</p>
          </div>
        </div>
      )}

      {/* ── Brand Dashboard ── */}
      {role === 'brand' && (
        <div className="space-y-10 fade-up stagger-2">

          {/* Active deals */}
          {brandDeals.length > 0 && (
            <section>
              <h2 className="section-label mb-4">Active Work</h2>
              <div className="space-y-3">
                {brandDeals.map(deal => (
                  <div key={deal.id} className="card card-hover flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#363535] truncate">{deal.jobs?.title}</p>
                      <p className="text-xs text-[#9a9a9a] mt-0.5">
                        {deal.creators?.display_name} · £{deal.budget?.toLocaleString()} budget
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={deal.status} />
                      <Link href={`/messages/${deal.id}`} className="btn-ghost text-xs py-1.5 px-3">Message →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My briefs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label mb-0">My Briefs</h2>
              <Link href="/jobs" className="text-xs text-[#6b6b6b] hover:text-[#363535]">See all →</Link>
            </div>
            {brandJobs.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm text-[#6b6b6b]">No briefs yet.</p>
                <Link href="/jobs/new" className="btn-primary mt-4 text-sm inline-block">Post your first brief</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {brandJobs.map(job => (
                  <div key={job.id} className="card card-hover flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#363535] truncate">{job.title}</p>
                      <p className="text-xs text-[#9a9a9a] mt-0.5">
                        {job.applications?.length || 0} proposals · {job.status}
                        {job.budget_range ? ` · ${job.budget_range}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={job.status} />
                      <Link href={`/jobs/${job.id}`} className="btn-ghost text-xs py-1.5 px-3">Manage →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Otto UGC campaign ideas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label mb-0">Quick start</h2>
              <Link href="/jobs/new" className="text-xs text-[#6b6b6b] hover:text-[#363535]">Post a brief →</Link>
            </div>
            <div className="card text-center py-8">
              <p className="text-sm font-semibold text-[#363535] mb-1.5">Ready to work with creators?</p>
              <p className="text-xs text-[#6b6b6b] mb-4">Post your first brief and get proposals from vetted tech UGC creators within 48 hours.</p>
              <Link href="/jobs/new" className="btn-primary text-sm inline-flex items-center gap-1.5">
                Post a Brief →
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* ── Creator Dashboard ── */}
      {role === 'creator' && (
        <div className="space-y-10 fade-up stagger-2">

          {/* Profile completeness */}
          <section>
            <h2 className="section-label mb-4">Your Profile</h2>
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#363535]">
                    {creatorProfile?.display_name || user?.user_metadata?.full_name || 'Your name'}
                  </p>
                  <p className="text-sm text-[#6b6b6b] mt-0.5">
                    {creatorProfile?.headline || 'Add a headline to your profile'}
                  </p>
                  {creatorProfile?.skills && creatorProfile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {creatorProfile.skills.slice(0, 5).map((s: string) => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-[#f0f0ec] rounded-full text-[#6b6b6b]">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/profile/edit" className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0">Edit</Link>
              </div>
            </div>
          </section>

          {/* Active deals */}
          {creatorDeals.length > 0 && (
            <section>
              <h2 className="section-label mb-4">Active Work</h2>
              <div className="space-y-3">
                {creatorDeals.map(deal => (
                  <div key={deal.id} className="card card-hover flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#363535] truncate">{deal.jobs?.title}</p>
                      <p className="text-xs text-[#9a9a9a] mt-0.5">
                        {deal.brands?.company_name} · £{deal.budget?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={deal.status} />
                      <Link href={`/messages/${deal.id}`} className="btn-ghost text-xs py-1.5 px-3">Message →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My applications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label mb-0">My Applications</h2>
              <Link href="/jobs" className="text-xs text-[#6b6b6b] hover:text-[#363535]">Browse briefs →</Link>
            </div>
            {creatorApps.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm text-[#6b6b6b]">No applications yet.</p>
                <Link href="/jobs" className="btn-primary mt-4 text-sm inline-block">Find your first brief</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {creatorApps.map(app => (
                  <div key={app.id} className="card card-hover flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#363535] truncate">{app.jobs?.title}</p>
                      <p className="text-xs text-[#9a9a9a] mt-0.5">{app.jobs?.brands?.company_name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={app.status} />
                      <Link href={`/jobs/${app.jobs?.id}`} className="btn-ghost text-xs py-1.5 px-3">View →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Otto featured opportunities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label mb-0">Otto UGC Opportunities</h2>
              <Link href="/jobs" className="text-xs text-[#6b6b6b] hover:text-[#363535]">Browse all →</Link>
            </div>
            <div className="space-y-3">
              {featuredJobs.map((job) => (
                <div key={job.id} className="card card-hover flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#363535] truncate">{job.title}</p>
                    <p className="text-xs text-[#9a9a9a] mt-0.5">{job.budget_range} · {job.timeline}</p>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="btn-ghost text-xs py-1.5 px-3">View →</Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Fallback dashboard when role metadata is missing ── */}
      {!role && (
        <div className="space-y-6 fade-up stagger-2">
          <section className="card">
            <h2 className="section-label mb-2">Finish setup</h2>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Your account is signed in, but role setup isn’t complete yet. You can still browse opportunities now.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/jobs" className="btn-primary">Find Work</Link>
              <Link href="/onboarding" className="btn-ghost">Complete profile</Link>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-label mb-0">Otto UGC Opportunities</h2>
              <Link href="/jobs" className="text-xs text-[#6b6b6b] hover:text-[#363535]">Browse all →</Link>
            </div>
            <div className="space-y-3">
              {featuredJobs.map((job) => (
                <div key={job.id} className="card card-hover flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#363535] truncate">{job.title}</p>
                    <p className="text-xs text-[#9a9a9a] mt-0.5">{job.budget_range} · {job.timeline}</p>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="btn-ghost text-xs py-1.5 px-3">View →</Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

    </div>
  )
}
