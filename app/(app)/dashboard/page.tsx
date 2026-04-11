'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
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

function FloatingNav({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold font-display tracking-tight text-[#363535] hover:opacity-80 transition-opacity">
          Otto
          <span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/messages" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Messages</Link>
          <span className="text-sm text-[#6b6b6b] hidden sm:block">{user?.email}</span>
          <button onClick={onSignOut} className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Sign out</button>
        </div>
      </div>
    </header>
  )
}

type Job = {
  id: string
  title: string
  status: string
  created_at: string
  applications: { id: string }[]
}

type Application = {
  id: string
  job_id: string
  status: string
  created_at: string
  jobs: { title: string; id: string; brands: { company_name: string } }
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)
  const [posted, setPosted] = useState(false)
  const [brandJobs, setBrandJobs] = useState<Job[]>([])
  const [creatorApps, setCreatorApps] = useState<Application[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('posted') === '1') setPosted(true)

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      setRole(user.user_metadata?.role || null)

      if (user.user_metadata?.role === 'brand') {
        const { data: brandData } = await supabase.from('brands').select('id').eq('user_id', user.id).single()
        if (brandData) {
          const { data: jobsData } = await supabase.from('jobs').select('*, applications(id)').eq('brand_id', brandData.id).order('created_at', { ascending: false }).limit(3)
          setBrandJobs((jobsData as any[]) || [])
        }
      } else if (user.user_metadata?.role === 'creator') {
        const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
        if (creatorData) {
          const { data: appsData } = await supabase.from('applications').select('*, jobs(id, title, brands(company_name))').eq('creator_id', creatorData.id).order('created_at', { ascending: false }).limit(3)
          setCreatorApps((appsData as any[]) || [])
        }
      }

      setLoading(false)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName =
    role === 'creator'
      ? user?.user_metadata?.display_name || user?.email
      : user?.email

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <FloatingNav user={user} onSignOut={handleSignOut} />

      <main className="pt-28 pb-20 max-w-6xl mx-auto px-6">
        {/* Success banner */}
        {posted && (
          <div className="mb-6 fade-up bg-[#ccff00] text-[#1c1c1c] rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-between">
            <span>✅ Brief posted successfully! Creators can now apply.</span>
            <button onClick={() => setPosted(false)} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Welcome header */}
        <div className="mb-10 fade-up">
          <h1 style={headlineStyle}>Welcome back, {displayName}.</h1>
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap gap-3 mb-10 fade-up stagger-1">
          {role === 'brand' && (
            <Link href="/jobs/new" className="btn-primary">Post a New Brief</Link>
          )}
          {role === 'creator' && (
            <Link href="/jobs" className="btn-primary">Browse Briefs</Link>
          )}
          <Link href="/messages" className="btn-ghost">Messages</Link>
        </div>

        {/* Content */}
        {role === 'brand' && (
          <div className="fade-up stagger-2">
            <p className="section-label mb-4">Your Recent Briefs</p>
            {brandJobs.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm text-[#6b6b6b]">No briefs yet.</p>
                <Link href="/jobs/new" className="btn-primary mt-4 text-sm">Post your first brief</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandJobs.map((job) => (
                  <div key={job.id} className="card card-hover space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-[#363535] pr-2 leading-tight">{job.title}</h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#6b6b6b]">
                      <span>{job.applications?.length || 0} proposals</span>
                    </div>
                    <Link href={`/jobs/${job.id}`} className="btn-ghost text-sm py-2 px-3 w-fit">View →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {role === 'creator' && (
          <div className="fade-up stagger-2">
            <p className="section-label mb-4">Your Applications</p>
            {creatorApps.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm text-[#6b6b6b]">No applications yet.</p>
                <Link href="/jobs" className="btn-primary mt-4 text-sm">Browse briefs</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorApps.map((app) => (
                  <div key={app.id} className="card card-hover space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-[#363535] pr-2 leading-tight">{app.jobs?.title}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                      <span>{app.jobs?.brands?.company_name}</span>
                    </div>
                    <Link href={`/jobs/${app.jobs?.id}/apply`} className="btn-ghost text-sm py-2 px-3 w-fit">View brief →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
