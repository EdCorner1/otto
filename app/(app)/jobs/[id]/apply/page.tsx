'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
  color: '#363535',
}

const PLATFORM_EMOJI: Record<string, string> = {
  'TikTok': '📸',
  'YouTube Shorts': '🎵',
  'Instagram Reels': '📷',
  'Twitter/X': '🐦',
  'LinkedIn': '💼',
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
  description: string
  platforms: string[]
  deliverables: string[]
  budget_range: string
  timeline: string
  brands: { company_name: string; industry: string }
}

export default function ApplyPage() {
  const params = useParams()
  const jobId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [creatorRate, setCreatorRate] = useState<string>('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      if (user.user_metadata?.role === 'brand') { router.push('/dashboard'); return }

      const { data: creatorData } = await supabase.from('creators').select('id, hourly_rate').eq('user_id', user.id).single()
      if (!creatorData) { router.push('/dashboard'); return }

      setUser(user)
      if (creatorData.hourly_rate) setCreatorRate(String(creatorData.hourly_rate))

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, brands(company_name, industry)')
        .eq('id', jobId)
        .single()

      if (!jobData) { router.push('/jobs'); return }
      setJob(jobData as Job)
      setLoading(false)
    }
    getUser()
  }, [jobId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message) return

    setSubmitting(true)

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', currentUser?.id).single()

    const { error } = await supabase.from('applications').insert({
      job_id: jobId,
      creator_id: creatorData?.id,
      message,
      status: 'pending',
    })

    setSubmitting(false)
    if (!error) setSuccess(true)
  }

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

  if (success) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <FloatingNav user={user} onSignOut={handleSignOut} />
        <main className="pt-28 pb-20 max-w-xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 style={headlineStyle} className="mb-4">Application sent!</h1>
          <p className="text-[#6b6b6b] mb-8">The brand will review your application and get in touch if interested.</p>
          <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
        </main>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <FloatingNav user={user} onSignOut={handleSignOut} />

      <main className="pt-28 pb-20 max-w-xl mx-auto px-6">
        <div className="mb-6 fade-up">
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Browse briefs
          </Link>
        </div>

        {/* Job summary card */}
        <div className="card mb-8 fade-up stagger-1">
          <div className="text-xs text-[#6b6b6b] mb-2">
            {job.brands?.company_name}
            {job.brands?.industry && <span className="ml-2 px-2 py-0.5 bg-[#e8e8e4] rounded-full">{job.brands.industry}</span>}
          </div>
          <h2 className="font-display text-xl font-semibold text-[#363535] mb-3" style={{ letterSpacing: '-0.5px' }}>{job.title}</h2>
          <p className="text-sm text-[#6b6b6b] leading-relaxed mb-4 line-clamp-3">{job.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(job.platforms || []).map(p => (
              <span key={p} className="text-sm">{PLATFORM_EMOJI[p] || '📋'} {p}</span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#ccff00]/20 rounded-full text-xs font-semibold text-[#363535]">{job.budget_range}</span>
            <span className="text-xs text-[#6b6b6b]">{job.timeline}</span>
          </div>
        </div>

        {/* Apply form */}
        <div className="fade-up stagger-2">
          <h1 style={headlineStyle} className="mb-2">Apply</h1>
          <p className="text-sm text-[#6b6b6b] mb-6">Tell the brand why you're a great fit.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block section-label mb-2">Your message <span className="text-red-400">*</span></label>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Share your relevant experience, links to your work, why you're excited about this brief..."
                rows={5}
                className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow resize-none"
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
                className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-3 text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !message}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#1c1c1c]/30 border-t-[#1c1c1c] rounded-full animate-spin" />
                  Sending...
                </span>
              ) : 'Send Application'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
