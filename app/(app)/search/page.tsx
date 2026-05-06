'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, BriefcaseBusiness, UserRound, Building2, X } from 'lucide-react'

type Scope = 'all' | 'jobs' | 'creators' | 'brands'

type SearchResponse = {
  query: string
  scope: Scope
  counts: {
    jobs: number
    creators: number
    brands: number
    total: number
  }
  results: {
    jobs: Array<{
      id: string
      title: string
      brandName: string
      budgetRange: string
      deadline: string | null
      timeline: string | null
      platforms: string[]
    }>
    creators: Array<{
      id: string
      name: string
      handle: string
      platform: string
      followerRange: string
      niche: string
    }>
    brands: Array<{
      id: string
      name: string
      industry: string
      activeBriefCount: number
    }>
  }
}

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'creators', label: 'Creators' },
  { value: 'brands', label: 'Brands' },
]

const EMPTY_RESULTS: SearchResponse = {
  query: '',
  scope: 'all',
  counts: { jobs: 0, creators: 0, brands: 0, total: 0 },
  results: { jobs: [], creators: [], brands: [] },
}

function formatDeadline(deadline: string | null, timeline: string | null) {
  if (timeline?.trim()) return timeline
  if (!deadline) return 'Flexible'

  const parsed = new Date(deadline)
  if (Number.isNaN(parsed.getTime())) return 'Flexible'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[#6b6b6b]">{icon}</span>
        <h2 className="text-sm font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{title}</h2>
      </div>
      <span className="rounded-full border border-[#e8e8e4] bg-white px-2.5 py-1 text-[11px] text-[#6b6b6b]">{count}</span>
    </div>
  )
}

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualTrigger, setManualTrigger] = useState(0)
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS)

  const hasQuery = query.trim().length > 0

  const performSearch = useCallback(async (searchQuery: string, activeScope: Scope, signal?: AbortSignal) => {
    const trimmed = searchQuery.trim()

    if (!trimmed) {
      setResults((prev) => ({ ...prev, query: '', scope: activeScope, counts: EMPTY_RESULTS.counts, results: EMPTY_RESULTS.results }))
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({
        q: trimmed,
        scope: activeScope,
      })

      const response = await fetch(`/api/search?${params.toString()}`, {
        cache: 'no-store',
        signal,
      })

      if (!response.ok) throw new Error('Search request failed.')
      const payload = (await response.json()) as SearchResponse
      setResults(payload)
    } catch {
      if (!signal?.aborted) {
        setResults((prev) => ({ ...prev, query: searchQuery.trim(), scope: activeScope }))
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    void performSearch(debouncedQuery, scope, controller.signal)
    return () => controller.abort()
  }, [debouncedQuery, scope, manualTrigger, performSearch])

  const isEmptyState = useMemo(() => {
    if (!hasQuery || loading) return false

    if (scope === 'jobs') return results.results.jobs.length === 0
    if (scope === 'creators') return results.results.creators.length === 0
    if (scope === 'brands') return results.results.brands.length === 0

    return results.counts.total === 0
  }, [hasQuery, loading, results, scope])

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 md:px-8">
        <div className="rounded-[28px] border border-[#e8e8e4] bg-white/90 p-5 shadow-sm md:p-7">
          <h1
            className="text-[clamp(34px,6vw,56px)] leading-[0.95] text-[#1c1c1e]"
            style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.04em' }}
          >
            Search Otto
          </h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">Find jobs, creators, and brands from one place.</p>

          <div className="mt-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a8a86]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setQuery('')
                    setDebouncedQuery('')
                    return
                  }

                  if (event.key === 'Enter') {
                    event.preventDefault()
                    setDebouncedQuery(query.trim())
                    setManualTrigger((v) => v + 1)
                  }
                }}
                placeholder="Search jobs, creators, or brands..."
                className="w-full rounded-2xl border border-[#e8e8e4] bg-white py-4 pl-12 pr-12 text-base text-[#1c1c1e] placeholder-[#9a9a9a] outline-none transition focus:border-[#d5f56b] focus:ring-4 focus:ring-[#ccff00]/20"
              />
              {hasQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setDebouncedQuery('')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#7f7f7b] hover:bg-[#f0f0ec]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SCOPES.map((tab) => {
                const active = tab.value === scope
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setScope(tab.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${active
                      ? 'border-[#c8ef4d] bg-[#ccff00] text-[#1c1c1e]'
                      : 'border-[#e8e8e4] bg-white text-[#6b6b6b] hover:border-[#d8d8d2] hover:text-[#1c1c1e]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading && hasQuery ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ccff00] border-t-transparent" />
            </div>
          ) : null}

          {isEmptyState ? (
            <div className="rounded-3xl border border-[#e8e8e4] bg-white px-6 py-16 text-center">
              <p className="text-lg text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>No results yet</p>
              <p className="mt-2 text-sm text-[#6b6b6b]">Try a broader keyword, different scope, or fewer words.</p>
            </div>
          ) : null}

          {!loading && hasQuery && !isEmptyState ? (
            <div className="space-y-8">
              {(scope === 'all' || scope === 'jobs') && results.results.jobs.length > 0 ? (
                <section>
                  <SectionTitle icon={<BriefcaseBusiness className="h-4 w-4" />} title="Jobs" count={results.results.jobs.length} />
                  <div className="grid gap-3">
                    {results.results.jobs.map((job) => (
                      <article key={job.id} className="rounded-2xl border border-[#e8e8e4] bg-white p-4 md:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-[#6b6b6b]">{job.brandName}</p>
                            <h3 className="text-lg text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{job.title}</h3>
                          </div>
                          <Link href={`/jobs/${job.id}`} className="rounded-full bg-[#1c1c1e] px-3.5 py-1.5 text-xs font-semibold text-white">
                            Apply
                          </Link>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-[#6b6b6b] md:grid-cols-3">
                          <p><span className="font-semibold text-[#1c1c1e]">Budget:</span> {job.budgetRange}</p>
                          <p><span className="font-semibold text-[#1c1c1e]">Deadline:</span> {formatDeadline(job.deadline, job.timeline)}</p>
                          <p className="truncate"><span className="font-semibold text-[#1c1c1e]">Platforms:</span> {job.platforms.join(', ') || 'N/A'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {(scope === 'all' || scope === 'creators') && results.results.creators.length > 0 ? (
                <section>
                  <SectionTitle icon={<UserRound className="h-4 w-4" />} title="Creators" count={results.results.creators.length} />
                  <div className="grid gap-3 md:grid-cols-2">
                    {results.results.creators.map((creator) => (
                      <article key={creator.id} className="rounded-2xl border border-[#e8e8e4] bg-white p-4 md:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{creator.name}</h3>
                            <p className="text-xs text-[#6b6b6b]">{creator.handle ? `@${creator.handle.replace(/^@+/, '')}` : '@unknown'}</p>
                          </div>
                          <Link href={`/creators/${creator.id}`} className="rounded-full border border-[#e8e8e4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1c1c1e] hover:border-[#1c1c1e]">
                            View profile
                          </Link>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-[#6b6b6b]">
                          <p><span className="font-semibold text-[#1c1c1e]">Platform:</span> {creator.platform}</p>
                          <p><span className="font-semibold text-[#1c1c1e]">Followers:</span> {creator.followerRange}</p>
                          <p><span className="font-semibold text-[#1c1c1e]">Niche:</span> {creator.niche}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {(scope === 'all' || scope === 'brands') && results.results.brands.length > 0 ? (
                <section>
                  <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Brands" count={results.results.brands.length} />
                  <div className="grid gap-3 md:grid-cols-2">
                    {results.results.brands.map((brand) => (
                      <article key={brand.id} className="rounded-2xl border border-[#e8e8e4] bg-white p-4 md:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{brand.name}</h3>
                            <p className="text-xs text-[#6b6b6b]">{brand.industry}</p>
                          </div>
                          <Link href={`/brands/${brand.id}`} className="rounded-full border border-[#e8e8e4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1c1c1e] hover:border-[#1c1c1e]">
                            View
                          </Link>
                        </div>
                        <p className="mt-3 text-xs text-[#6b6b6b]"><span className="font-semibold text-[#1c1c1e]">Active briefs:</span> {brand.activeBriefCount}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {!hasQuery ? (
            <div className="rounded-3xl border border-dashed border-[#d9d9d5] px-6 py-12 text-center text-sm text-[#7a7a76]">
              Start typing to search across jobs, creators, and brands.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
