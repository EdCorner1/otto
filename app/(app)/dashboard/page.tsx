'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
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
  id: string; display_name: string; headline: string; skills: string[]
}

type Deal = {
  id: string; status: string; budget: number
  jobs: { title: string }; brands: { company_name: string }; creators: { display_name: string }
}

export default function DashboardPage() {
  const [user, setUser] = useState<{
    id: string; email?: string
    user_metadata?: { role?: 'brand' | 'creator'; full_name?: string }
  } | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)
  const [posted, setPosted] = useState(false)
  const [brandJobs, setBrandJobs] = useState<Job[]>([])
  const [brandDeals, setBrandDeals] = useState<Deal[]>([])
  const [creatorApps, setCreatorApps] = useState<Application[]>([])
  const [creatorDeals, setCreatorDeals] = useState<Deal[]>([])
  const [creatorProfile, setCreatorProfile] = useState<Creator | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('posted') === '1') setPosted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const userRole = (user.user_metadata?.role || null) as Role
      setRole(userRole)

      if (userRole === 'brand') {
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
      } else if (userRole === 'creator') {
        const { data: creatorData } = await supabase
          .from('creators').select('*').eq('user_id', user.id).single()
        if (creatorData) {
          setCreatorProfile(creatorData as Creator)
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

  return (
    <div className="max-w-4xl mx-auto px-6">

      {/* Success banner */}
      {posted && (
        <div className="mb-6 fade-up bg-[#ccff00] text-[#1c1c1c] rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-between">
          <span>✅ Brief posted successfully! Creators can now apply.</span>
          <button onClick={() => setPosted(false)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 fade-up">
        <h1 style={headlineStyle}>Welcome back, {displayName}.</h1>
        <p className="text-[#6b6b6b] mt-2 text-sm">
          {role === 'brand' ? 'Manage your briefs and track active work.' : 'Track your applications and active deals.'}
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-10 fade-up stagger-1">
        {role === 'brand' && (
          <Link href="/jobs/new" className="btn-primary">Post a New Brief</Link>
        )}
        {role === 'creator' && (
          <Link href="/jobs" className="btn-primary">Browse Briefs</Link>
        )}
        <Link href="/messages" className="btn-ghost">Messages</Link>
        {role === 'creator' && (
          <Link href={`/creators/${user?.id}`} className="btn-ghost">View my profile</Link>
        )}
      </div>

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
        </div>
      )}

    </div>
  )
}
