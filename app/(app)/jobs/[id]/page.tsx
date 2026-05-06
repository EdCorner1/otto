'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
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

function splitPortfolioLinks(value: string) {
  return value
    .split(/\n|,/) // newline or comma separated
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id as string

  const [user, setUser] = useState<{ id: string; user_metadata?: { role?: string } } | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  const [portfolioLinksText, setPortfolioLinksText] = useState('')
  const [pitchMessage, setPitchMessage] = useState('')
  const [proposedRate, setProposedRate] = useState('')
  const [availabilityDate, setAvailabilityDate] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const supabase = createClient()
  const demoJob = useMemo(() => getDemoJobById(jobId), [jobId])

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

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
  }, [demoJob, jobId, supabase])

  useEffect(() => {
    if (!user?.id || !jobId || job?.status !== 'open' || job?.isDemo) return

    const checkApplication = async () => {
      const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
      if (!creatorData) return

      const { data: app } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('creator_id', creatorData.id)
        .maybeSingle()

      if (app) setAlreadyApplied(true)
    }

    checkApplication()
  }, [job, jobId, supabase, user?.id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')

    const links = splitPortfolioLinks(portfolioLinksText)
    if (links.length === 0) {
      setSubmitError('Please include at least one portfolio link.')
      return
    }

    if (!pitchMessage.trim()) {
      setSubmitError('Please add a pitch message.')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setSubmitError('Please sign in again to apply.')
        setSubmitting(false)
        return
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobId,
          portfolioLinks: links,
          pitchMessage: pitchMessage.trim(),
          proposedRate: proposedRate ? Number(proposedRate) : null,
          availabilityDate: availabilityDate || null,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setSubmitError(payload?.error || 'Could not submit your application. Please try again.')
        setSubmitting(false)
        return
      }

      setSubmitSuccess(true)
      setAlreadyApplied(true)
      setSubmitting(false)
    } catch {
      setSubmitError('Something went wrong. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (!job)
    return (
      <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
        <p className="text-[#6b6b6b]">Job not found.</p>
        <Link href="/jobs" className="btn-primary mt-4 inline-block">
          Back to briefs
        </Link>
      </div>
    )

  const isCreator = user?.user_metadata?.role === 'creator'
  const canApply = isCreator && job.status === 'open' && !alreadyApplied && !job.isDemo

  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5"
        >
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
                fontFamily: 'var(--font-bricolage)',
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
          <span
            className={`flex-shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize
            ${job.status === 'open' ? 'bg-[#ccff00]/20 text-[#363535]' : 'bg-[#e8e8e4] text-[#6b6b6b]'}`}
          >
            {job.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.platforms?.map((p) => <PlatformBadge key={p} platform={p} />)}
        </div>

        <div className="border-t border-[#f0f0ec] pt-4">
          <DetailRow label="Budget" value={job.budget_range || 'Not specified'} />
          <DetailRow label="Timeline" value={job.timeline || 'Not specified'} />
          {job.deadline && (
            <DetailRow
              label="Deadline"
              value={new Date(job.deadline).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          )}
          <DetailRow label="Proposals" value={job.isDemo ? 'Demo brief (sample)' : `${job.applications?.length || 0} so far`} />
        </div>
      </div>

      {job.description && (
        <div className="card mb-6">
          <h2 className="text-sm font-bold text-[#363535] mb-3">Brief</h2>
          <div className="text-sm text-[#6b6b6b] whitespace-pre-wrap leading-relaxed">{job.description}</div>
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

      <div className="card mb-8">
        {job.status !== 'open' ? (
          <p className="text-sm text-[#9a9a9a] text-center py-2">This brief is no longer open.</p>
        ) : job.isDemo ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-[#363535] mb-2">Otto Featured Opportunity</p>
            <p className="text-xs text-[#9a9a9a] mb-4">
              This is a curated sample brief to keep the marketplace active while we expand live campaigns.
            </p>
            <Link href={`/signup?source=otto-featured-brief&job=${encodeURIComponent(job.title)}`} className="btn-primary">
              Express interest →
            </Link>
          </div>
        ) : alreadyApplied || submitSuccess ? (
          <div className="text-center py-1">
            <CheckCircle className="w-9 h-9 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#363535] mb-1">Application sent.</p>
            <p className="text-xs text-[#9a9a9a] mb-4">The brand can now review your pitch and portfolio links.</p>
            <Link href="/messages" className="btn-ghost text-sm">
              Go to messages
            </Link>
          </div>
        ) : !user ? (
          <div className="text-center">
            <p className="text-sm text-[#6b6b6b] mb-3">Sign in to apply for this brief.</p>
            <Link href="/login" className="btn-primary text-sm">
              Sign in to apply
            </Link>
          </div>
        ) : canApply ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>
                Submit your application
              </h3>
              <p className="text-sm text-[#6b6b6b] mt-1">
                Share your portfolio, your pitch, proposed rate, and availability.
              </p>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl border border-red-100 bg-red-50 text-sm text-red-600">{submitError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block section-label mb-2">
                  Portfolio link(s) <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={portfolioLinksText}
                  onChange={(e) => setPortfolioLinksText(e.target.value)}
                  rows={3}
                  placeholder="Paste links (one per line or comma separated)"
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none"
                />
              </div>

              <div>
                <label className="block section-label mb-2">
                  Pitch message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  rows={5}
                  placeholder="Why are you a strong fit for this brief?"
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block section-label mb-2">Proposed rate (£)</label>
                  <input
                    type="number"
                    min="1"
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    placeholder="e.g. 350"
                    className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  />
                </div>

                <div>
                  <label className="block section-label mb-2">Availability date</label>
                  <input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                    className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending application...' : 'Send application'}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-[#9a9a9a] text-center py-2">Only creators can apply for briefs.</p>
        )}
      </div>
    </div>
  )
}
