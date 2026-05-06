'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardList, Search, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { DEMO_JOBS } from '@/lib/demo-jobs'

const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1,
  letterSpacing: '-0.5px',
  color: '#1c1c1e',
}

type DbJob = {
  id: string
  title: string
  description: string
  platforms: string[]
  budget_range: string
  created_at: string
  deadline?: string | null
  timeline?: string | null
  job_type?: string | null
  category?: string | null
  deliverables?: string[] | null
  brands?: { company_name?: string; industry?: string | null } | null
}

type DisplayJob = {
  id: string
  title: string
  description: string
  platforms: string[]
  budget_range: string
  created_at: string
  deadline?: string | null
  timeline?: string | null
  job_type?: string
  brands: { company_name: string; industry?: string }
  budgetMin: number
  budgetMax: number
  isDemo: boolean
}

const PLATFORM_OPTIONS = ['All', 'TikTok', 'Instagram', 'YouTube'] as const
const BUDGET_OPTIONS = ['All', 'Under £300', '£300-£600', '£600+'] as const
const DEADLINE_OPTIONS = ['All', 'Due in 7 days', 'Due in 14 days', 'Due in 30 days', 'Flexible'] as const
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget_desc', label: 'Budget high-low' },
  { value: 'deadline_soon', label: 'Deadline soonest' },
] as const

function parseBudgetRange(range: string) {
  const matches = range.match(/\d[\d,]*/g) || []
  const values = matches.map((value) => Number(value.replace(/,/g, ''))).filter((v) => Number.isFinite(v))

  const min = values[0] ?? 0
  const max = values[1] ?? values[0] ?? 0
  return { min, max }
}

function normalizePlatform(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes('instagram')) return 'Instagram'
  if (p.includes('youtube')) return 'YouTube'
  if (p.includes('tiktok')) return 'TikTok'
  return platform
}

function inferJobType(job: Pick<DisplayJob, 'job_type' | 'title'> & { deliverables?: string[] | null }) {
  if (job.job_type?.trim()) return job.job_type.trim()

  const fromDeliverable = job.deliverables?.[0]
  if (fromDeliverable?.trim()) return fromDeliverable.trim()

  const title = job.title.toLowerCase()
  if (title.includes('review') || title.includes('testimonial')) return 'Product review'
  if (title.includes('tutorial') || title.includes('how-to')) return 'Tutorial'
  if (title.includes('ad') || title.includes('creative')) return 'Ad creative'
  return 'UGC campaign'
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatDeadline(deadline?: string | null) {
  if (!deadline) return 'Flexible'
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return 'Flexible'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function daysUntil(deadline?: string | null) {
  if (!deadline) return Number.POSITIVE_INFINITY
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<DisplayJob[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<(typeof PLATFORM_OPTIONS)[number]>('All')
  const [budgetFilter, setBudgetFilter] = useState<(typeof BUDGET_OPTIONS)[number]>('All')
  const [deadlineFilter, setDeadlineFilter] = useState<(typeof DEADLINE_OPTIONS)[number]>('All')
  const [jobTypeFilter, setJobTypeFilter] = useState('All')
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]['value']>('newest')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, brands(company_name, industry)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      const liveJobs: DisplayJob[] = ((jobsData as DbJob[]) || []).map((job) => {
        const budget = parseBudgetRange(job.budget_range || '')
        const deliverables = job.deliverables || []

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          platforms: (job.platforms || []).map(normalizePlatform),
          budget_range: job.budget_range,
          created_at: job.created_at,
          deadline: job.deadline,
          timeline: job.timeline,
          job_type: inferJobType({ job_type: job.job_type ?? job.category ?? undefined, title: job.title, deliverables }),
          brands: {
            company_name: job.brands?.company_name || 'Brand',
            industry: job.brands?.industry || '',
          },
          budgetMin: budget.min,
          budgetMax: budget.max,
          isDemo: false,
        }
      })

      const minDemoCount = 4
      const targetCount = 14
      const neededToReachTarget = Math.max(0, targetCount - liveJobs.length)
      const demoCount = Math.max(minDemoCount, neededToReachTarget)

      const demoJobs: DisplayJob[] = DEMO_JOBS.slice(0, demoCount).map((job) => {
        const budget = parseBudgetRange(job.budget_range)
        return {
          id: job.id,
          title: job.title,
          description: job.description,
          platforms: (job.platforms || []).map(normalizePlatform),
          budget_range: job.budget_range,
          created_at: job.created_at,
          timeline: job.timeline,
          deadline: null,
          job_type: inferJobType({ job_type: job.deliverables?.[0], title: job.title, deliverables: job.deliverables }),
          brands: {
            company_name: job.brand.company_name,
            industry: job.brand.industry,
          },
          budgetMin: budget.min,
          budgetMax: budget.max,
          isDemo: true,
        }
      })

      setJobs([...liveJobs, ...demoJobs])
      setLoading(false)
    }

    load()
  }, [router, supabase])

  const jobTypeOptions = useMemo(() => {
    const types = new Set<string>()
    jobs.forEach((job) => {
      if (job.job_type) types.add(job.job_type)
    })

    return ['All', ...Array.from(types).sort((a, b) => a.localeCompare(b))]
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const filtered = jobs.filter((job) => {
      if (keyword) {
        const searchable = `${job.title} ${job.brands.company_name}`.toLowerCase()
        if (!searchable.includes(keyword)) return false
      }

      if (platformFilter !== 'All') {
        if (!job.platforms.some((platform) => platform.toLowerCase().includes(platformFilter.toLowerCase()))) {
          return false
        }
      }

      if (budgetFilter === 'Under £300' && !(job.budgetMax > 0 && job.budgetMax < 300)) return false
      if (budgetFilter === '£300-£600' && !(job.budgetMax >= 300 && job.budgetMin <= 600)) return false
      if (budgetFilter === '£600+' && job.budgetMax < 600) return false

      const daysLeft = daysUntil(job.deadline)
      if (deadlineFilter === 'Due in 7 days' && !(daysLeft >= 0 && daysLeft <= 7)) return false
      if (deadlineFilter === 'Due in 14 days' && !(daysLeft >= 0 && daysLeft <= 14)) return false
      if (deadlineFilter === 'Due in 30 days' && !(daysLeft >= 0 && daysLeft <= 30)) return false
      if (deadlineFilter === 'Flexible' && Number.isFinite(daysLeft)) return false

      if (jobTypeFilter !== 'All' && job.job_type !== jobTypeFilter) return false

      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'budget_desc') return b.budgetMax - a.budgetMax
      if (sortBy === 'deadline_soon') return daysUntil(a.deadline) - daysUntil(b.deadline)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return sorted
  }, [jobs, search, platformFilter, budgetFilter, deadlineFilter, jobTypeFilter, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <main className="pt-24 pb-20 max-w-5xl mx-auto px-6">
        <div className="mb-7">
          <h1 style={headlineStyle}>Find your next paid brief</h1>
          <p className="text-sm text-[#6b6b6b] mt-2">
            Search opportunities, filter for fit, and apply in minutes.
          </p>
        </div>

        <section className="card mb-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9a9a9a] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or brand"
              className="w-full bg-white border border-[#e8e8e4] rounded-xl pl-10 pr-4 py-3 text-sm text-[#1c1c1e] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#6b6b6b]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters & sort
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as (typeof PLATFORM_OPTIONS)[number])}
              className="bg-white border border-[#e8e8e4] rounded-xl px-3 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All platforms' : option}
                </option>
              ))}
            </select>

            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value as (typeof BUDGET_OPTIONS)[number])}
              className="bg-white border border-[#e8e8e4] rounded-xl px-3 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            >
              {BUDGET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'Any budget' : option}
                </option>
              ))}
            </select>

            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value as (typeof DEADLINE_OPTIONS)[number])}
              className="bg-white border border-[#e8e8e4] rounded-xl px-3 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            >
              {DEADLINE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'Any deadline' : option}
                </option>
              ))}
            </select>

            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="bg-white border border-[#e8e8e4] rounded-xl px-3 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            >
              {jobTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'Any job type' : option}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as (typeof SORT_OPTIONS)[number]['value'])}
              className="bg-white border border-[#e8e8e4] rounded-xl px-3 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-[#9a9a9a]">{filteredJobs.length} briefs matched</p>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="card text-center py-16">
            <div className="mb-4 flex justify-center">
              <ClipboardList className="w-10 h-10 text-[#d0d0d0]" />
            </div>
            <h2 className="text-lg text-[#363535] mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>
              No briefs match these filters
            </h2>
            <p className="text-sm text-[#6b6b6b]">Try widening your platform, budget, or deadline filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block card card-hover transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs text-[#9a9a9a] mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#363535]">{job.brands.company_name}</span>
                      {job.brands.industry ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#f0f0ec] text-[#6b6b6b]">{job.brands.industry}</span>
                      ) : null}
                      {job.isDemo ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#ccff00]/30 text-[#363535] font-semibold">Otto Featured</span>
                      ) : null}
                      <span>• {formatRelativeDate(job.created_at)}</span>
                    </p>
                    <h2 className="text-lg text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.3px' }}>
                      {job.title}
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-[#6b6b6b] line-clamp-2 mb-4">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.platforms.map((platform) => (
                    <span key={platform} className="text-xs font-medium px-2.5 py-1 bg-white border border-[#e8e8e4] rounded-full text-[#6b6b6b]">
                      {platform}
                    </span>
                  ))}
                  {job.job_type ? (
                    <span className="text-xs font-medium px-2.5 py-1 bg-[#1c1c1e] text-white rounded-full">{job.job_type}</span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#ecece8] bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">Budget fit</p>
                    <p className="text-sm font-semibold text-[#1c1c1e]">{job.budget_range}</p>
                  </div>
                  <div className="rounded-xl border border-[#ecece8] bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">Timeline</p>
                    <p className="text-sm font-semibold text-[#1c1c1e]">{job.timeline || formatDeadline(job.deadline)}</p>
                  </div>
                  <div className="rounded-xl border border-[#ecece8] bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">Brand</p>
                    <p className="text-sm font-semibold text-[#1c1c1e]">{job.brands.company_name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
