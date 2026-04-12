'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const PLATFORM_EMOJI: Record<string, string> = {
  'TikTok': '📸', 'YouTube Shorts': '🎵', 'Instagram Reels': '📷',
  'Twitter/X': '🐦', 'LinkedIn': '💼',
}

type Job = {
  id: string; title: string; description: string
  platforms: string[]; deliverables: string[]; budget_range: string; timeline: string
  brands: { company_name: string; industry: string }
}

export default function ApplyPage() {
  const params = useParams()
  const jobId = params.id as string
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [creatorRate, setCreatorRate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.user_metadata?.role === 'brand') { router.push('/dashboard'); return }
      const { data: creatorData } = await supabase
        .from('creators').select('id, hourly_rate').eq('user_id', user.id).single()
      if (!creatorData) { router.push('/onboarding'); return }
      setUser(user)
      if (creatorData.hourly_rate) setCreatorRate(String(creatorData.hourly_rate))

      const { data: jobData } = await supabase
        .from('jobs').select('*, brands(company_name, industry)')
        .eq('id', jobId).single()
      if (!jobData) { router.push('/jobs'); return }
      setJob(jobData as Job)
      setLoading(false)
    }
    getUser()
  }, [jobId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const { data: creatorData } = await supabase
      .from('creators').select('id').eq('user_id', currentUser?.id).single()

    await supabase.from('applications').insert({
      job_id: jobId,
      creator_id: creatorData?.id,
      message: message.trim(),
      proposed_rate: creatorRate ? Number(creatorRate) : null,
      status: 'pending',
    })
    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-10 text-center">
        <div className="text-5xl mb-6">✅</div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)',
          letterSpacing: '-1.5px', color: '#1c1c1e',
        }} className="mb-4">
          Application sent!
        </h1>
        <p className="text-[#6b6b6b] mb-8">
          The brand will review your application and message you if they&apos;re interested.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
          <Link href="/jobs" className="btn-ghost">Browse more briefs</Link>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="max-w-xl mx-auto px-6">

      {/* Back */}
      <div className="mb-6">
        <Link href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors">
          ← Back to brief
        </Link>
      </div>

      {/* Job summary */}
      <div className="card mb-8">
        <p className="text-xs text-[#9a9a9a] mb-1.5">
          {job.brands?.company_name}
          {job.brands?.industry && <span className="ml-2 px-2 py-0.5 bg-[#e8e8e4] rounded-full">{job.brands.industry}</span>}
        </p>
        <h2 style={{ fontSize: '22px',
          letterSpacing: '-0.5px', color: '#1c1c1e',
        }} className="mb-3">{job.title}</h2>

        <div className="flex flex-wrap gap-2 mb-3">
          {(job.platforms || []).map(p => (
            <span key={p} className="text-sm text-[#6b6b6b]">
              {PLATFORM_EMOJI[p] ?? '📋'} {p}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[#ccff00]/20 rounded-full text-xs font-semibold text-[#363535]">
            {job.budget_range}
          </span>
          <span className="text-xs text-[#6b6b6b]">{job.timeline}</span>
        </div>
      </div>

      {/* Form */}
      <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)',
        letterSpacing: '-1.5px', color: '#1c1c1e',
      }} className="mb-1">Apply</h1>
      <p className="text-sm text-[#6b6b6b] mb-6">Tell the brand why you&apos;re the right creator for this.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block section-label mb-2">
            Your message <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Share your relevant experience, links to your work, why you're excited about this brief..."
            rows={5}
            className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535]
              placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none"
          />
        </div>

        <div>
          <label className="block section-label mb-2">Your proposed rate (£)</label>
          <input
            type="number"
            value={creatorRate}
            onChange={e => setCreatorRate(e.target.value)}
            placeholder="e.g. 250"
            min="1"
            className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535]
              placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending...' : 'Send application'}
        </button>
      </form>
    </div>
  )
}
