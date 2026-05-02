'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Step = 1 | 2 | 3 | 4

type FormData = {
  title: string
  description: string
  jobType: string
  targetPlatforms: string[]
  audienceRequirement: string
  contentFormat: string
  numberOfPosts: string
  ugcRightsNeeded: 'yes' | 'no'
  budgetRange: string
  payType: string
  deadline: string
}

const JOB_TYPES = ['Ad creative', 'Product review', 'Tutorial', 'Lifestyle integrated', 'Other']
const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube', 'Multi-platform']
const AUDIENCE_OPTIONS = ['Any', 'Nano (under 10K)', 'Micro (10K–50K)', 'Mid (50K–500K)', 'Macro (500K+)']
const FORMAT_OPTIONS = ['Vertical video', 'Horizontal', 'Both']
const BUDGET_OPTIONS = ['Under $500', '$500–2K', '$2K–10K', '$10K+']
const PAY_TYPE_OPTIONS = ['Fixed', 'Negotiable', 'Commission only']

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-0.5px',
  color: '#1c1c1e',
}

export default function NewJobPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    jobType: '',
    targetPlatforms: [],
    audienceRequirement: 'Any',
    contentFormat: 'Vertical video',
    numberOfPosts: '1',
    ugcRightsNeeded: 'yes',
    budgetRange: '',
    payType: 'Fixed',
    deadline: '',
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const invitedCreatorId = searchParams.get('invite')?.trim() || ''
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const role = user.user_metadata?.role
      if (role === 'creator') {
        router.push('/dashboard')
        return
      }

      const { data: brandData } = await supabase
        .from('brands')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!brandData) {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const canContinueStep1 = useMemo(() => {
    return Boolean(formData.title.trim() && formData.description.trim() && formData.jobType)
  }, [formData.title, formData.description, formData.jobType])

  const canContinueStep2 = useMemo(() => {
    return Boolean(
      formData.targetPlatforms.length > 0 &&
      formData.audienceRequirement &&
      formData.contentFormat &&
      Number(formData.numberOfPosts) > 0 &&
      formData.ugcRightsNeeded
    )
  }, [formData])

  const canSubmit = useMemo(() => {
    return Boolean(
      canContinueStep1 &&
      canContinueStep2 &&
      formData.budgetRange &&
      formData.payType &&
      formData.deadline
    )
  }, [canContinueStep1, canContinueStep2, formData.budgetRange, formData.payType, formData.deadline])

  const togglePlatform = (platform: string) => {
    setFormData((prev) => {
      const exists = prev.targetPlatforms.includes(platform)
      return {
        ...prev,
        targetPlatforms: exists
          ? prev.targetPlatforms.filter((item) => item !== platform)
          : [...prev.targetPlatforms, platform],
      }
    })
  }

  const goNext = () => {
    setError('')
    setStep((prev) => (Math.min(prev + 1, 4) as Step))
  }

  const goBack = () => {
    setError('')
    setStep((prev) => (Math.max(prev - 1, 1) as Step))
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please complete all required fields before submitting.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...formData, invitedCreatorId: invitedCreatorId || null }),
      })

      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body?.error || 'Could not post brief. Please try again.')
      }

      router.push(`/jobs/${body.id}/manage?posted=1${body.invitedDealId ? '&invited=1' : ''}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <main className="pt-24 pb-20 max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#1c1c1e] transition-colors mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to dashboard
          </Link>
          <h1 style={headlineStyle}>Create a new brief</h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">{invitedCreatorId ? 'Create a focused brief for this creator. Once posted, Otto will open the invite thread.' : 'A clean brief gets better creator matches. This takes about 3 minutes.'}</p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#ecece7] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center ${step >= s ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-[#f2f2ed] text-[#9a9a9a]'}`}>
                  {s}
                </div>
                {s < 4 && <div className={`h-1 flex-1 rounded-full ${step > s ? 'bg-[#ccff00]' : 'bg-[#efefe9]'}`} />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#9a9a9a]">Step {step} of 4</p>
          {invitedCreatorId && (
            <p className="mt-2 rounded-xl bg-[#efffd3] px-3 py-2 text-xs font-medium text-[#355400]">Creator invite attached — posting this brief will start a deal thread with the selected creator.</p>
          )}
        </div>

        <section className="rounded-3xl border border-[#ecece7] bg-white p-6 sm:p-8 shadow-[0_16px_35px_rgba(28,28,30,0.04)]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>Job basics</h2>
                <p className="text-sm text-[#6b6b6b] mt-1">Give creators clear context on what you need.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title <span className="text-red-500">*</span></label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. UGC ad for AI meeting notes app"
                  className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What should the creator say, show, and avoid? Include key message, tone, CTA, and any must-have talking points."
                  className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-y min-h-[180px]"
                />
                <p className="mt-2 text-xs text-[#9a9a9a]">Tip: include hook idea, product angle, and success criteria for stronger submissions.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Job type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {JOB_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, jobType: type }))}
                      className={`rounded-xl border px-4 py-3 text-sm text-left transition-all ${formData.jobType === type ? 'border-[#ccff00] bg-[#ccff00]/20 text-[#1c1c1e]' : 'border-[#e8e8e4] text-[#5f5f62] hover:border-[#d7d7d1]'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>Requirements</h2>
                <p className="text-sm text-[#6b6b6b] mt-1">Define fit and output expectations.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Target platforms <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.targetPlatforms.includes(platform) ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-white border border-[#e8e8e4] text-[#5f5f62]'}`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Audience requirement <span className="text-red-500">*</span></label>
                  <select
                    value={formData.audienceRequirement}
                    onChange={(e) => setFormData((prev) => ({ ...prev, audienceRequirement: e.target.value }))}
                    className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  >
                    {AUDIENCE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content format <span className="text-red-500">*</span></label>
                  <select
                    value={formData.contentFormat}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contentFormat: e.target.value }))}
                    className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  >
                    {FORMAT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of posts <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={formData.numberOfPosts}
                    onChange={(e) => setFormData((prev) => ({ ...prev, numberOfPosts: e.target.value }))}
                    className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">UGC rights needed <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {(['yes', 'no'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, ugcRightsNeeded: value }))}
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium capitalize ${formData.ugcRightsNeeded === value ? 'border-[#ccff00] bg-[#ccff00]/20 text-[#1c1c1e]' : 'border-[#e8e8e4] text-[#5f5f62]'}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>Budget</h2>
                <p className="text-sm text-[#6b6b6b] mt-1">Set pay expectations and timeline upfront.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Budget range <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {BUDGET_OPTIONS.map((option) => (
                    <label key={option} className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer ${formData.budgetRange === option ? 'border-[#ccff00] bg-[#ccff00]/15' : 'border-[#e8e8e4]'}`}>
                      <input
                        type="radio"
                        name="budget"
                        checked={formData.budgetRange === option}
                        onChange={() => setFormData((prev) => ({ ...prev, budgetRange: option }))}
                        className="accent-[#1c1c1e]"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pay type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.payType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, payType: e.target.value }))}
                    className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  >
                    {PAY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full rounded-xl border border-[#e8e8e4] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>Review and submit</h2>
                <p className="text-sm text-[#6b6b6b] mt-1">Final check before your brief goes live.</p>
              </div>

              <div className="rounded-2xl border border-[#ecece7] bg-[#fcfcfa] p-5 space-y-4">
                <SummaryRow label="Title" value={formData.title} />
                <SummaryRow label="Description" value={formData.description} multiline />
                <SummaryRow label="Job type" value={formData.jobType} />
                <SummaryRow label="Platforms" value={formData.targetPlatforms.join(', ')} />
                <SummaryRow label="Audience" value={formData.audienceRequirement} />
                <SummaryRow label="Format" value={formData.contentFormat} />
                <SummaryRow label="Posts" value={formData.numberOfPosts} />
                <SummaryRow label="UGC rights" value={formData.ugcRightsNeeded === 'yes' ? 'Required' : 'Not required'} />
                <SummaryRow label="Budget" value={formData.budgetRange} />
                <SummaryRow label="Pay type" value={formData.payType} />
                <SummaryRow label="Deadline" value={new Date(formData.deadline).toLocaleDateString()} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1 || submitting}
              className="px-4 py-2 rounded-xl border border-[#e8e8e4] text-sm text-[#5f5f62] disabled:opacity-40"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2) || (step === 3 && (!formData.budgetRange || !formData.payType || !formData.deadline))}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : invitedCreatorId ? 'Post brief and invite creator' : 'Post brief'}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function SummaryRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 border-b border-[#efefe8] pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9a9a9a]">{label}</p>
      <p className={`text-sm text-[#1c1c1e] ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>{value || '-'}</p>
    </div>
  )
}
