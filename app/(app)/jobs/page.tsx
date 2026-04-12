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
  category?: string
  brands: { company_name: string; industry: string }
}

type DisplayJob = {
  id: string
  title: string
  description: string
  platforms: string[]
  budget_range: string
  created_at: string
  category?: string
  brands: { company_name: string; industry: string }
  isDemo?: boolean
}

const FILTERS = ['All', 'Tech & Gadgets', 'Fitness & Health', 'Travel & Lifestyle', 'Language Learning', 'AI & Productivity', 'Gaming', 'Food & Drink', 'Fashion & Beauty', 'Finance & SaaS']

const JOB_CATEGORIES: Record<string, string> = {
  'demo-raycon-earbuds-1': 'Tech & Gadgets',
  'demo-pingo-smart-2': 'Tech & Gadgets',
  'demo-detris-fitness-3': 'Fitness & Health',
  'demo-lingika-app-4': 'Language Learning',
  'demo-airalo-travel-5': 'Travel & Lifestyle',
  'demo-pipo-ai-6': 'AI & Productivity',
  'demo-clawbite-7': 'AI & Productivity',
  'demo-nomad-protein-8': 'Fitness & Health',
  'demo-stackra-saas-9': 'Finance & SaaS',
  'demo-wyze-cam-10': 'Tech & Gadgets',
  'demo-12south-11': 'Tech & Gadgets',
  'demo-raycon-work-12': 'Tech & Gadgets',
  'demo-pingo-night-13': 'Travel & Lifestyle',
  'demo-detris-weight-14': 'Fitness & Health',
  'demo-otto-launch-15': 'AI & Productivity',
  'demo-otto-howto-16': 'AI & Productivity',
  'demo-airalo-esim-17': 'Travel & Lifestyle',
  'demo-pipo-reminder-18': 'AI & Productivity',
  'demo-clawbite-deal-19': 'AI & Productivity',
  'demo-nomad-supps-20': 'Fitness & Health',
  'demo-stackra-pro-21': 'Finance & SaaS',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<DisplayJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
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

      const liveJobs: DisplayJob[] = ((jobsData as DbJob[]) || []).map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        platforms: j.platforms,
        budget_range: j.budget_range,
        created_at: j.created_at,
        category: j.category ?? undefined,
        brands: {
          company_name: j.brands?.company_name ?? 'Brand',
          industry: j.brands?.industry ?? '',
        },
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
        category: JOB_CATEGORIES[j.id] ?? 'Other',
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

  const filteredJobs = useMemo(() => {
    if (activeFilter === 'All') return jobs
    return jobs.filter(j => j.category === activeFilter)
  }, [jobs, activeFilter])

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
        <div className="mb-6 fade-up">
          <div className="flex items-center justify-between mb-1 gap-3">
            <h1 style={headlineStyle}>Open Briefs</h1>
            <span className="section-label">{filteredJobs.length} available</span>
          </div>
          <p className="text-xs text-[#9a9a9a]">
            {liveCount} live brief{liveCount !== 1 ? 's' : ''} + curated Otto opportunities to keep your pipeline moving.
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="mb-6 fade-up stagger-1">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === filter
                    ? 'bg-[#1c1c1e] text-white'
                    : 'bg-white border border-[#e8e8e4] text-[#6b6b6b] hover:border-[#363535]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="font-display text-xl font-semibold text-[#363535] mb-2">No briefs in this category</h2>
            <p className="text-sm text-[#6b6b6b]">Try a different filter or check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job, i) => (
              <div key={job.id} className={`card card-hover space-y-3 fade-up stagger-${Math.min(i + 1, 5)}`}>
                {/* Company + date + category */}
                <div className="flex items-center gap-2 text-xs text-[#6b6b6b] flex-wrap">
                  <span className="font-semibold text-[#363535]">{job.brands?.company_name || 'Brand'}</span>
                  {job.brands?.industry && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-0.5 bg-[#e8e8e4] rounded-full text-[#6b6b6b]">{job.brands.industry}</span>
                    </>
                  )}
                  {job.category && !job.isDemo && (
                    <>
                      <span>·</span>
                      <span className="px-2 py-0.5 bg-[#ccff00]/20 rounded-full text-[#363535] font-semibold">{job.category}</span>
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
