'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEMO_JOBS } from '@/lib/demo-jobs'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
  color: '#363535',
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

type DbJob = {
  id: string
  title: string
  description: string
  platforms: string[]
  budget_range: string
  created_at: string
  brands: { company_name: string; industry: string }
}

type DisplayJob = {
  id: string
  title: string
  description: string
  platforms: string[]
  budget_range: string
  created_at: string
  brands: { company_name: string; industry: string }
  isDemo?: boolean
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<DisplayJob[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, brands(company_name, industry)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      const liveJobs = ((jobsData as DbJob[]) || []).map((j) => ({
        ...j,
        isDemo: false,
      }))

      // Always show a small set of Otto Featured demos so the feed never looks empty/stale.
      const minDemoCount = 4
      const targetCount = 14
      const neededToReachTarget = Math.max(0, targetCount - liveJobs.length)
      const demoCount = Math.max(minDemoCount, neededToReachTarget)

      const demoJobs: DisplayJob[] = DEMO_JOBS.slice(0, demoCount).map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        platforms: j.platforms,
        budget_range: j.budget_range,
        created_at: j.created_at,
        brands: {
          company_name: j.brand.company_name,
          industry: j.brand.industry,
        },
        isDemo: true,
      }))

      setJobs([...liveJobs, ...demoJobs])
      setLoading(false)
    }

    load()
  }, [])

  const liveCount = useMemo(() => jobs.filter((j) => !j.isDemo).length, [jobs])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <main className="pt-28 pb-20 max-w-3xl mx-auto px-6">
        <div className="mb-8 fade-up">
          <div className="flex items-center justify-between mb-1 gap-3">
            <h1 style={headlineStyle}>Open Briefs</h1>
            <span className="section-label">{jobs.length} available</span>
          </div>
          <p className="text-xs text-[#9a9a9a]">
            {liveCount} live brief{liveCount !== 1 ? 's' : ''} + curated Otto opportunities to keep your pipeline moving.
          </p>
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
                <div className="flex items-center gap-2 text-xs text-[#6b6b6b] flex-wrap">
                  <span className="font-semibold text-[#363535]">{job.brands?.company_name || 'Brand'}</span>
                  {job.brands?.industry && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-0.5 bg-[#e8e8e4] rounded-full text-[#6b6b6b]">{job.brands.industry}</span>
                    </>
                  )}
                  {job.isDemo && (
                    <span className="px-2 py-0.5 bg-[#ccff00]/30 rounded-full text-[#363535] font-semibold">
                      Otto Featured
                    </span>
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
                  {(job.platforms || []).map((p) => (
                    <span key={p} className="text-sm text-[#363535]">
                      ● {p}
                    </span>
                  ))}
                </div>

                {/* Budget + CTA */}
                <div className="flex items-center justify-between pt-1">
                  <span className="px-3 py-1 bg-[#ccff00]/20 rounded-full text-xs font-semibold text-[#363535]">
                    {job.budget_range}
                  </span>

                  {job.isDemo ? (
                    <Link href={`/jobs/${job.id}`} className="btn-primary text-sm py-2 px-5">
                      View brief →
                    </Link>
                  ) : (
                    <Link href={`/jobs/${job.id}/apply`} className="btn-primary text-sm py-2 px-5">
                      Apply →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
