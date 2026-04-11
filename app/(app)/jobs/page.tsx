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

const PLATFORM_EMOJI: Record<string, string> = {
  'TikTok': '📸',
  'YouTube Shorts': '🎵',
  'Instagram Reels': '📷',
  'Twitter/X': '🐦',
  'LinkedIn': '💼',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
  budget_range: string
  created_at: string
  brands: { company_name: string; industry: string }
}

export default function JobsPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { role?: 'brand' | 'creator' } } | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      if (user.user_metadata?.role === 'brand') { router.push('/dashboard'); return }

      const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
      if (!creatorData) { router.push('/dashboard'); return }

      setUser(user)

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, brands(company_name, industry)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      setJobs((jobsData as Job[]) || [])
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

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <FloatingNav user={user} onSignOut={handleSignOut} />

      <main className="pt-28 pb-20 max-w-2xl mx-auto px-6">
        <div className="mb-8 fade-up">
          <div className="flex items-center justify-between mb-1">
            <h1 style={headlineStyle}>Open Briefs</h1>
            <span className="section-label">{jobs.length} available</span>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="font-display text-xl font-semibold text-[#363535] mb-2">No briefs yet</h2>
            <p className="text-sm text-[#6b6b6b]">Check back soon — new briefs are posted daily.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <div key={job.id} className={`card card-hover space-y-3 fade-up stagger-${Math.min(i + 1, 5)}`}>
                {/* Company + date */}
                <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                  <span className="font-semibold text-[#363535]">{job.brands?.company_name || 'Brand'}</span>
                  {job.brands?.industry && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-0.5 bg-[#e8e8e4] rounded-full text-[#6b6b6b]">{job.brands.industry}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(job.created_at)}</span>
                </div>

                {/* Title */}
                <h2 className="font-display text-lg font-semibold text-[#363535]" style={{ letterSpacing: '-0.5px' }}>
                  {job.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-[#6b6b6b] line-clamp-2 leading-relaxed">{job.description}</p>

                {/* Platforms */}
                <div className="flex flex-wrap gap-2">
                  {(job.platforms || []).map(p => (
                    <span key={p} className="text-sm text-[#363535]">
                      {PLATFORM_EMOJI[p] || '📋'} {p}
                    </span>
                  ))}
                </div>

                {/* Budget + Apply */}
                <div className="flex items-center justify-between pt-1">
                  <span className="px-3 py-1 bg-[#ccff00]/20 rounded-full text-xs font-semibold text-[#363535]">
                    {job.budget_range}
                  </span>
                  <Link href={`/jobs/${job.id}/apply`} className="btn-primary text-sm py-2 px-5">
                    Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
