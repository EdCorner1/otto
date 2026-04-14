'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ClipboardList } from 'lucide-react'

type Application = {
  id: string; message: string; proposed_rate?: number; status: string; created_at: string
  creators: {
    id: string; display_name: string; avatar_url?: string; headline?: string
    bio?: string; skills?: string[]; location?: string; hourly_rate?: string
    availability?: string; creator_socials?: { platform: string; url: string }[]
  }
}

type Job = {
  id: string; title: string; description: string; budget_range: string
  timeline: string; status: string; platforms: string[]; deliverables: string[]
  applications?: { id: string }[]
}

export default function JobManagePage() {
  const params = useParams()
  const jobId = params.id as string
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [dealCreated, setDealCreated] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.user_metadata?.role !== 'brand') { router.push('/dashboard'); return }
      setUser(user)

      const { data: brandData } = await supabase
        .from('brands').select('id, company_name').eq('user_id', user.id).single()
      if (!brandData) { router.push('/dashboard'); return }

      const { data: jobData } = await supabase
        .from('jobs').select('*').eq('id', jobId).single()
      if (!jobData || jobData.brand_id !== brandData.id) { router.push('/dashboard'); return }
      setJob(jobData as Job)

      const { data: appsData } = await supabase
        .from('applications').select('*, creators(*)')
        .eq('job_id', jobId).order('created_at', { ascending: true })
      setApps((appsData as Application[]) || [])
      setLoading(false)
    }
    getUser()
  }, [jobId])

  const handleAccept = async (app: Application) => {
    if (!job || !user) return
    setAccepting(app.id)
    setActionError('')

    try {
      // Re-verify job ownership before any action
      const { data: brandData } = await supabase
        .from('brands').select('id, company_name').eq('user_id', user.id).single()
      if (!brandData) throw new Error('Brand profile not found.')

      const { data: jobData } = await supabase
        .from('jobs').select('brand_id').eq('id', job.id).single()
      if (!jobData || jobData.brand_id !== brandData.id) throw new Error('Unauthorized.')

      const { data: deal, error: dealError } = await supabase.from('deals').insert({
        job_id: job.id,
        brand_id: brandData.id,
        creator_id: app.creators.id,
        budget: app.proposed_rate || null,
        status: 'proposed',
      }).select().single()

      if (dealError) throw dealError

      await supabase.from('applications').update({ status: 'rejected' })
        .eq('job_id', job.id).neq('id', app.id)
      await supabase.from('applications').update({ status: 'accepted' })
        .eq('id', app.id)
      await supabase.from('jobs').update({ status: 'filled' }).eq('id', job.id)
      await supabase.from('messages').insert({
        deal_id: deal.id,
        sender_id: user.id,
        sender_name: brandData.company_name || 'Brand',
        content: `You have been selected for "${job.title}". Head over to discuss the brief and get started.`,
      })

      setDealCreated(app.creators.id)
      setJob(prev => prev ? { ...prev, status: 'filled' } : null)
      setApps(prev => prev.map(a => ({
        ...a,
        status: a.id === app.id ? 'accepted' : 'rejected',
      })))
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setAccepting(null)
    }
  }

  const handleReject = async (appId: string) => {
    setRejecting(appId)
    setActionError('')
    try {
      await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId)
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a))
    } catch {
      setActionError('Failed to decline. Please try again.')
    } finally {
      setRejecting(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
      <p className="text-[#6b6b6b]">Job not found.</p>
      <Link href="/dashboard" className="btn-primary mt-4 inline-block">Back to dashboard</Link>
    </div>
  )

  const pendingApps = apps.filter(a => a.status === 'pending' || a.status === 'accepted')
  const otherApps = apps.filter(a => a.status !== 'pending' && a.status !== 'accepted')

  return (
    <div className="max-w-2xl mx-auto px-6">

      {/* Back */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5">
          ← Dashboard
        </Link>
      </div>

      {/* Job summary */}
      <div className="card mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)',
              letterSpacing: '-1.5px', color: '#1c1c1e',
            }} className="mb-1">{job.title}</h1>
            <div className="flex items-center gap-3 text-xs text-[#9a9a9a]">
              <span className={`inline-block px-2 py-0.5 rounded-full font-semibold capitalize
                ${job.status === 'open' ? 'bg-[#ccff00]/20 text-[#363535]' : 'bg-[#e8e8e4] text-[#6b6b6b]'}`}>
                {job.status}
              </span>
              <span>{job.platforms?.join(', ')}</span>
              <span>·</span>
              <span>{job.budget_range}</span>
            </div>
          </div>
        </div>

        {job.description && (
          <p className="text-sm text-[#6b6b6b] mt-3 pt-3 border-t border-[#f0f0ec]">{job.description}</p>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#f0f0ec]">
          <div className="text-center">
            <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', color: '#1c1c1e' }}>
              {apps.length}
            </p>
            <p className="text-xs text-[#9a9a9a]">Proposals</p>
          </div>
          <div className="text-center">
            <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', color: '#1c1c1e' }}>
              {pendingApps.length}
            </p>
            <p className="text-xs text-[#9a9a9a]">Pending</p>
          </div>
          {job.timeline && (
            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', color: '#1c1c1e' }}>
                {job.timeline}
              </p>
              <p className="text-xs text-[#9a9a9a]">Timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* Accepted state */}
      {dealCreated && (
        <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1"><CheckCircle size={14} /> Creator selected</p>
          <p className="text-xs text-green-700 mb-3">A conversation has been started. Head to Messages to discuss next steps.</p>
          <Link href="/messages" className="text-xs font-semibold text-green-800 underline">Go to Messages →</Link>
        </div>
      )}

      {/* Pending applications */}
      {pendingApps.length === 0 && !dealCreated ? (
        <div className="card text-center py-10">
          <div className="mb-3 flex justify-center"><ClipboardList className="w-10 h-10 text-[#d0d0d0]" /></div>
          <p className="text-sm text-[#6b6b6b]">No proposals yet.</p>
          <p className="text-xs text-[#9a9a9a] mt-1">Share your brief with creators to get proposals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 style={{ fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e',
          }} className="mb-4">
            Proposals ({pendingApps.length})
          </h2>

          {pendingApps.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              isAccepted={dealCreated === app.creators.id}
              isAccepting={accepting === app.id}
              isRejecting={rejecting === app.id}
              onAccept={() => handleAccept(app)}
              onReject={() => handleReject(app.id)}
              jobBudget={job.budget_range}
            />
          ))}
        </div>
      )}

      {/* Other applications */}
      {otherApps.length > 0 && (
        <div className="mt-10">
          <h2 style={{ fontSize: '16px', letterSpacing: '-0.5px', color: '#9a9a9a',
          }} className="mb-4">
            Declined ({otherApps.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {otherApps.map(app => (
              <div key={app.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#f0f0ec] flex items-center justify-center text-sm font-bold text-[#9a9a9a]">
                  {app.creators?.display_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#9a9a9a]">{app.creators?.display_name}</p>
                  <p className="text-xs text-[#9a9a9a]">Declined</p>
                </div>
                <span className="text-xs text-[#9a9a9a] px-2 py-0.5 bg-[#f0f0ec] rounded-full">Withdrawn</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function ApplicationCard({
  app, isAccepted, isAccepting, isRejecting, onAccept, onReject, jobBudget,
}: {
  app: Application
  isAccepted: boolean
  isAccepting: boolean
  isRejecting: boolean
  onAccept: () => void
  onReject: () => void
  jobBudget?: string
}) {
  const creator = app.creators
  const socials = creator?.creator_socials || []

  return (
    <div className={`card ${isAccepted ? 'border-[#ccff00] bg-[#ccff00]/[0.03]' : ''}`}>
      {isAccepted && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="text-xs font-bold px-2 py-0.5 bg-[#ccff00] text-[#1c1c1e] rounded-full">Selected</span>
        </div>
      )}

      {/* Creator header */}
      <div className="flex items-start gap-4 mb-4">
        {creator?.avatar_url ? (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#e8e8e4] flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-lg font-bold text-[#9a9a9a] flex-shrink-0">
            {creator?.display_name?.[0] ?? '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontSize: '16px', color: '#1c1c1e' }}>
              {creator?.display_name || 'Creator'}
            </p>
            {creator?.availability === 'open' && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Available</span>
            )}
          </div>
          {creator?.headline && (
            <p className="text-xs text-[#6b6b6b] mt-0.5">{creator.headline}</p>
          )}
          {creator?.location && (
            <p className="text-xs text-[#9a9a9a] mt-0.5">📍 {creator.location}</p>
          )}
        </div>
      </div>

      {/* Skills */}
      {creator?.skills && creator.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {creator.skills.slice(0, 6).map((s: string) => (
            <span key={s} className="text-xs px-2.5 py-1 bg-[#f0f0ec] rounded-full text-[#6b6b6b]">{s}</span>
          ))}
        </div>
      )}

      {/* Message */}
      {app.message && (
        <div className="p-4 bg-[#fafaf9] rounded-xl mb-4">
          <p className="text-xs font-semibold text-[#9a9a9a] mb-2">Their message</p>
          <p className="text-sm text-[#363535] whitespace-pre-wrap leading-relaxed">{app.message}</p>
        </div>
      )}

      {/* Proposed rate */}
      {app.proposed_rate && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#f0f0ec]">
          <div>
            <p className="text-xs text-[#9a9a9a]">Proposed rate</p>
            <p style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', color: '#1c1c1e' }}>
              £{app.proposed_rate.toLocaleString()}
            </p>
          </div>
          {jobBudget && (
            <div className="text-right">
              <p className="text-xs text-[#9a9a9a]">Your budget</p>
              <p className="text-sm font-medium text-[#6b6b6b]">{jobBudget}</p>
            </div>
          )}
        </div>
      )}

      {/* Social links */}
      {socials.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          {socials.slice(0, 4).map((s: { platform: string; url: string }) => (
            <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 bg-[#f0f0ec] rounded-full text-[#6b6b6b] hover:text-[#363535] transition-colors capitalize">
              {s.platform}
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      {!isAccepted && (
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            disabled={isAccepting || isRejecting}
            className="btn-primary text-sm flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAccepting ? (
              <><span className="w-4 h-4 border-2 border-[#1c1c1e]/30 border-t-[#1c1c1e] rounded-full animate-spin" /> Selecting...</>
            ) : 'Select this creator'}
          </button>
          <button
            onClick={onReject}
            disabled={isAccepting || isRejecting}
            className="btn-ghost text-sm px-4 disabled:opacity-50"
          >
            {isRejecting ? 'Declining...' : 'Pass'}
          </button>
          <Link href={`/creators/${creator?.id}`} className="btn-ghost text-sm">View profile →</Link>
        </div>
      )}
    </div>
  )
}
