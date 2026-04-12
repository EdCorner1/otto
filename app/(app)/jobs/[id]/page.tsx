'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getDemoJobById } from '@/lib/demo-jobs'

type Job = {
  id: string
  title: string
  description: string
  platforms: string[]
  deliverables: string[]
  budget_range: string
  timeline: string
  status: string
  deadline?: string
  requirements?: string[]
  brand_id?: string
  brands: { company_name: string; industry: string; website?: string }
  applications: { id: string }[]
  isDemo?: boolean
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e8e4] rounded-full text-xs font-medium text-[#363535]">
      <span>●</span>
      {platform}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f0f0ec] last:border-0">
      <span className="text-xs font-semibold text-[#9a9a9a] w-28 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-[#363535]">{value}</span>
    </div>
  )
}

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id as string
  const [user, setUser] = useState<{ id: string; user_metadata?: { role?: string } } | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const supabase = createClient()

  const demoJob = useMemo(() => getDemoJobById(jobId), [jobId])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!jobId) return

    const getJob = async () => {
      if (demoJob) {
        setJob({
          id: demoJob.id,
          title: demoJob.title,
          description: demoJob.description,
          platforms: demoJob.platforms,
          deliverables: demoJob.deliverables,
          budget_range: demoJob.budget_range,
          timeline: demoJob.timeline,
          status: demoJob.status,
          requirements: demoJob.requirements,
          brands: {
            company_name: demoJob.brand.company_name,
            industry: demoJob.brand.industry,
            website: demoJob.brand.website,
          },
          applications: [],
          isDemo: true,
        })
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('jobs')
        .select('*, brands(company_name, industry, website), applications(id)')
        .eq('id', jobId)
        .single()

      setJob(data as Job)
      setLoading(false)
    }

    getJob()
  }, [jobId, demoJob])

  // Check if creator already applied (live jobs only)
  useEffect(() => {
    if (!user?.id || !jobId || job?.status !== 'open' || job?.isDemo) return

    const checkApplication = async () => {
      const { data: creatorData } = await supabase
        .from('creators').select('id').eq('user_id', user.id).single()
      if (!creatorData) return

      const { data: app } = await supabase
        .from('applications').select('id').eq('job_id', jobId).eq('creator_id', creatorData.id).single()
      if (app) setAlreadyApplied(true)
    }

    checkApplication()
  }, [user, jobId, job])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
      <p className="text-[#6b6b6b]">Job not found.</p>
      <Link href="/jobs" className="btn-primary mt-4 inline-block">Back to briefs</Link>
    </div>
  )

  const isCreator = user?.user_metadata?.role === 'creator'
  const canApply = isCreator && job.status === 'open' && !alreadyApplied && !job.isDemo

  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="mb-6">
        <Link href="/jobs" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5">
          ← All briefs
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1
              style={{
                fontSize: 'clamp(22px, 4vw, 32px)',
                lineHeight: 1.1,
                letterSpacing: '-1.5px',
                color: '#1c1c1e',
              }}
              className="mb-2"
            >
              {job.title}
            </h1>
            <p className="text-sm text-[#6b6b6b]">
              {job.brands?.company_name}
              {job.brands?.industry ? ` · ${job.brands.industry}` : ''}
            </p>
          </div>
          <span className={`flex-shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize
            ${job.status === 'open' ? 'bg-[#ccff00]/20 text-[#363535]' : 'bg-[#e8e8e4] text-[#6b6b6b]'}`}>
            {job.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.platforms?.map(p => <PlatformBadge key={p} platform={p} />)}
        </div>

        <div className="border-t border-[#f0f0ec] pt-4">
          <DetailRow label="Budget" value={job.budget_range || 'Not specified'} />
          <DetailRow label="Timeline" value={job.timeline || 'Not specified'} />
          {job.deadline && <DetailRow label="Deadline" value={new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
          <DetailRow label="Proposals" value={job.isDemo ? 'Demo brief (sample)' : `${job.applications?.length || 0} so far`} />
        </div>
      </div>

      {job.description && (
        <div className="card mb-6">
          <h2 className="text-sm font-bold text-[#363535] mb-3">Brief</h2>
          <div className="text-sm text-[#6b6b6b] whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </div>
      )}

      {job.deliverables && job.deliverables.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-bold text-[#363535] mb-3">What you need to deliver</h2>
          <ul className="space-y-2">
            {job.deliverables.map((d: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#6b6b6b]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] mt-2 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-bold text-[#363535] mb-3">Ideal creator</h2>
          <ul className="space-y-2">
            {job.requirements.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#6b6b6b]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#363535] mt-2 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        {job.status !== 'open' ? (
          <p className="text-sm text-[#9a9a9a] text-center py-2">This brief is no longer open.</p>
        ) : job.isDemo ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-[#363535] mb-2">Otto Featured Opportunity</p>
            <p className="text-xs text-[#9a9a9a] mb-4">
              This is a curated sample brief to keep the marketplace active while we expand live campaigns.
            </p>
            <Link
              href={`/signup?source=otto-featured-brief&job=${encodeURIComponent(job.title)}`}
              className="btn-primary"
            >
              Express interest →
            </Link>
          </div>
        ) : alreadyApplied ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-[#363535] mb-2">You&apos;ve applied to this brief.</p>
            <p className="text-xs text-[#9a9a9a]">Check your messages for updates.</p>
            <Link href="/messages" className="btn-ghost mt-4 text-sm">Go to messages</Link>
          </div>
        ) : !user ? (
          <div className="text-center">
            <p className="text-sm text-[#6b6b6b] mb-3">Sign in to apply for this brief.</p>
            <Link href="/login" className="btn-primary text-sm">Sign in to apply</Link>
          </div>
        ) : canApply ? (
          <div className="text-center">
            <p className="text-sm text-[#6b6b6b] mb-3">Ready to apply? Tell the brand why you&apos;re a great fit.</p>
            <Link href={`/jobs/${job.id}/apply`} className="btn-primary">
              Apply for this brief →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[#9a9a9a] text-center py-2">Only creators can apply for briefs.</p>
        )}
      </div>
    </div>
  )
}
