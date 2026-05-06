'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, Globe, Link2, Music4, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Role = 'brand' | 'creator' | null

type CreatorCardItem = {
  id: string
  name: string
  handle: string
  avatarUrl: string | null
  headline: string | null
  mainPlatform: string
  followerRange: string
  incomeLevel: string
  contentTypes: string[]
  nicheTags: string[]
  topPortfolioThumbnail: string | null
}

type CreatorsResponse = {
  creators: CreatorCardItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PLATFORM_OPTIONS = ['all', 'tiktok', 'instagram', 'youtube']
const FOLLOWER_OPTIONS = ['all', '< 1K', '1K – 10K', '10K – 50K', '50K – 250K', '250K – 500K', '500K +']
const NICHE_OPTIONS = ['all', 'SaaS & AI', 'Tech & Apps', 'AI Tools', 'Creator Economy', 'Productivity', 'Health & Fitness', 'Travel', 'Lifestyle & Vlogs', 'Gaming', 'Fintech']
const CONTENT_TYPE_OPTIONS = ['all', 'Ad creative', 'Product review', 'Tutorial / demo', 'Lifestyle integrated']
const INCOME_OPTIONS = ['all', 'Not sharing', '$0 – $500/mo', '$500 – $2K/mo', '$2K – $5K/mo', '$5K+/mo']

const platformIconClassName = 'h-3.5 w-3.5'

function PlatformIcon({ platform }: { platform: string }) {
  const normalized = platform.toLowerCase()

  if (normalized === 'tiktok') return <Music4 className={platformIconClassName} />
  if (normalized === 'instagram') return <Camera className={platformIconClassName} />
  if (normalized === 'youtube') return <Play className={platformIconClassName} />
  if (normalized === 'website') return <Globe className={platformIconClassName} />
  return <Link2 className={platformIconClassName} />
}

function labelCase(value: string) {
  if (!value) return 'Platform'
  if (value === 'tiktok') return 'TikTok'
  if (value === 'instagram') return 'Instagram'
  if (value === 'youtube') return 'YouTube'
  return value
}

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

function CreatorCard({ creator, role }: { creator: CreatorCardItem; role: Role }) {
  const trimmedHandle = creator.handle?.replace(/^@+/, '')

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#e8e8e4] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.06]">
      <Link href={`/creators/${creator.id}`} className="block">
        <div className="relative aspect-[4/3] bg-[#efefe9]">
          {creator.topPortfolioThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.topPortfolioThumbnail}
              alt={`${creator.name} portfolio preview`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#6b6b6b]">No portfolio thumbnail</div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#1c1c1e]/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <PlatformIcon platform={creator.mainPlatform} />
            <span>{labelCase(creator.mainPlatform)}</span>
          </span>
          {creator.followerRange && (
            <span className="absolute right-3 top-3 rounded-full bg-[#ccff00] px-2.5 py-1 text-[11px] font-semibold text-[#1c1c1e]">
              {creator.followerRange}
            </span>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-3 flex items-start gap-3">
          {creator.avatarUrl ? (
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-[#e8e8e4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creator.avatarUrl} alt={creator.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-[#d9d9d4] bg-[#f5f5f0] text-sm font-semibold text-[#6b6b6b]">
              {(creator.name || '?').slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <Link href={`/creators/${creator.id}`} className="block">
              <h3 className="truncate text-base font-semibold text-[#1c1c1e]">{creator.name}</h3>
            </Link>
            <p className="truncate text-xs text-[#7a7a75]">@{trimmedHandle || 'creator'}</p>
            {creator.headline && <p className="mt-1 line-clamp-2 text-xs text-[#6b6b6b]">{creator.headline}</p>}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {creator.nicheTags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex rounded-full border border-[#ecece8] bg-[#fafaf7] px-2.5 py-1 text-[11px] font-medium text-[#545450]">
              {tag}
            </span>
          ))}
          {!creator.nicheTags.length && (
            <span className="inline-flex rounded-full border border-[#ecece8] bg-[#fafaf7] px-2.5 py-1 text-[11px] text-[#9a9a93]">
              No niche tags yet
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/creators/${creator.id}`} className="btn-ghost flex-1 justify-center border border-[#e8e8e4] text-xs">
            View profile
          </Link>
          {role === 'brand' ? (
            <Link href={`/jobs/new?invite=${creator.id}`} className="btn-primary flex-1 justify-center text-xs">
              Invite to apply
            </Link>
          ) : (
            <span className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#ecece8] bg-[#f8f8f5] px-3 py-2.5 text-xs font-medium text-[#7a7a75]">
              Brand-only invites
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<Role>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'all')
  const [followerRange, setFollowerRange] = useState(searchParams.get('follower_range') || 'all')
  const [niche, setNiche] = useState(searchParams.get('niche') || 'all')
  const [contentType, setContentType] = useState(searchParams.get('content_type') || 'all')
  const [incomeLevel, setIncomeLevel] = useState(searchParams.get('income_level') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page') || '1') || 1)

  const [creators, setCreators] = useState<CreatorCardItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    let cancelled = false

    const resolveRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setRole(null)
          setRoleLoading(false)
        }
        return
      }

      const { data: roleRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      if (!cancelled) {
        setRole((roleRow?.role as Role) || null)
        setRoleLoading(false)
      }
    }

    void resolveRole()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    const query = new URLSearchParams()
    if (debouncedSearch.trim()) query.set('q', debouncedSearch.trim())
    if (platform !== 'all') query.set('platform', platform)
    if (followerRange !== 'all') query.set('follower_range', followerRange)
    if (niche !== 'all') query.set('niche', niche)
    if (contentType !== 'all') query.set('content_type', contentType)
    if (incomeLevel !== 'all') query.set('income_level', incomeLevel)
    if (sort !== 'newest') query.set('sort', sort)
    if (page > 1) query.set('page', String(page))

    const queryString = query.toString()
    router.replace(queryString ? `/explore?${queryString}` : '/explore', { scroll: false })
  }, [contentType, debouncedSearch, followerRange, incomeLevel, niche, page, platform, router, sort])

  useEffect(() => {
    let cancelled = false

    const loadCreators = async () => {
      setLoading(true)
      const query = new URLSearchParams({
        page: String(page),
        page_size: '12',
        sort,
      })

      if (debouncedSearch.trim()) query.set('q', debouncedSearch.trim())
      if (platform !== 'all') query.set('platform', platform)
      if (followerRange !== 'all') query.set('follower_range', followerRange)
      if (niche !== 'all') query.set('niche', niche)
      if (contentType !== 'all') query.set('content_type', contentType)
      if (incomeLevel !== 'all') query.set('income_level', incomeLevel)

      const response = await fetch(`/api/creators?${query.toString()}`)
      if (!response.ok) {
        if (!cancelled) {
          setCreators([])
          setTotal(0)
          setTotalPages(0)
          setLoading(false)
        }
        return
      }

      const payload = (await response.json()) as CreatorsResponse

      if (!cancelled) {
        setCreators(payload.creators || [])
        setTotal(payload.total || 0)
        setTotalPages(payload.totalPages || 0)
        setLoading(false)
      }
    }

    void loadCreators()

    return () => {
      cancelled = true
    }
  }, [contentType, debouncedSearch, followerRange, incomeLevel, niche, page, platform, sort])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, platform, followerRange, niche, contentType, incomeLevel, sort])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
    if (page <= 3) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [page - 2, page - 1, page, page + 1, page + 2]
  }, [page, totalPages])

  const resetFilters = () => {
    setSearch('')
    setPlatform('all')
    setFollowerRange('all')
    setNiche('all')
    setContentType('all')
    setIncomeLevel('all')
    setSort('newest')
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1c1e]">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label mb-2">Creator marketplace</p>
            <h1 className="font-display text-[#1c1c1e]" style={{ fontSize: 'clamp(30px, 5vw, 46px)', letterSpacing: '-0.045em', lineHeight: 1.0 }}>
              Explore creators
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6b6b6b]">
              Browse creator profiles by platform, niche, and output style. Curated for premium UGC partnerships.
            </p>
          </div>

          {!roleLoading && role === 'creator' && (
            <div className="rounded-2xl border border-[#e7efc4] bg-[#f7fbe8] px-4 py-3 text-xs text-[#3c3c39]">
              You&apos;re seeing the marketplace preview. Brands can invite creators directly from this view.
            </div>
          )}
        </div>

        <section className="mb-7 rounded-3xl border border-[#e8e8e4] bg-white p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Search</label>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or @handle"
                className="w-full rounded-xl border border-[#e8e8e4] bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1c1e] placeholder:text-[#999992] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Sort by</label>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3.5 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                <option value="newest">Newest</option>
                <option value="most_active">Most active</option>
                <option value="highest_follower_range">Highest follower range</option>
              </select>
            </div>

            <div className="flex items-end">
              <button onClick={resetFilters} className="btn-ghost w-full justify-center border border-[#e8e8e4] text-sm">
                Reset filters
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Platform</label>
              <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3.5 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All platforms' : labelCase(option)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Follower range</label>
              <select value={followerRange} onChange={(event) => setFollowerRange(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3.5 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                {FOLLOWER_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All ranges' : option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Niche</label>
              <select value={niche} onChange={(event) => setNiche(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3.5 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                {NICHE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All niches' : option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Content type</label>
              <select value={contentType} onChange={(event) => setContentType(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3.5 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All content types' : option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#7a7a75]">Income level</label>
              <select value={incomeLevel} onChange={(event) => setIncomeLevel(event.target.value)} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3.5 py-2.5 text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]">
                {INCOME_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option === 'all' ? 'All income levels' : option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#74746f]">
            {loading ? 'Loading creators…' : `${total} creator${total === 1 ? '' : 's'} found`}
          </p>
          <p className="text-xs text-[#9a9a93]">12 per page</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[360px] animate-pulse rounded-3xl border border-[#ecece8] bg-white" />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-3xl border border-[#e8e8e4] bg-white px-6 py-16 text-center">
            <p className="mb-2 text-base font-semibold text-[#1c1c1e]">No creators match those filters.</p>
            <p className="text-sm text-[#6b6b6b]">Try broadening your platform, niche, or audience criteria.</p>
            <button onClick={resetFilters} className="btn-primary mt-5">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} role={role} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  className="btn-ghost border border-[#e8e8e4] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => setPage(number)}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                      number === page
                        ? 'border-[#ccff00] bg-[#ccff00] text-[#1c1c1e]'
                        : 'border-[#e8e8e4] bg-white text-[#666660] hover:border-[#d8d8d1]'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  className="btn-ghost border border-[#e8e8e4] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
