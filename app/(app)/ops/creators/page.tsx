'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, LoaderCircle, Search, ShieldAlert, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const OWNER_EMAILS = (process.env.NEXT_PUBLIC_OTTO_OWNER_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)

type CreatorReviewRow = {
  id: string
  userId: string
  email: string
  name: string
  handle: string
  publicUrl: string
  createdAt: string | null
  videoCount: number
  hasIntroVideo: boolean
  socialCount: number
  brandLogos: number
  reviews: number
  featuredWork: number
  status: 'ready' | 'needs_review' | 'incomplete'
  missing: string[]
}

function statusClass(status: CreatorReviewRow['status']) {
  if (status === 'ready') return 'border-[#d7f7a7] bg-[#f2ffdc] text-[#315100]'
  if (status === 'needs_review') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-[#ecece7] bg-[#f5f5f1] text-[#6b6b66]'
}

function statusLabel(status: CreatorReviewRow['status']) {
  if (status === 'ready') return 'Ready'
  if (status === 'needs_review') return 'Needs review'
  return 'Incomplete'
}

export default function OpsCreatorsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [creators, setCreators] = useState<CreatorReviewRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.replace('/login?redirectTo=/ops/creators')
        return
      }

      const ownerEmail = (user.email || '').toLowerCase().trim()
      if (!OWNER_EMAILS.includes(ownerEmail)) {
        router.replace('/dashboard')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        router.replace('/login?redirectTo=/ops/creators')
        return
      }

      try {
        const response = await fetch('/api/ops/creators', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || 'Could not load creators.')
        if (!cancelled) setCreators(payload.creators || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load creators.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  const filteredCreators = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return creators
    return creators.filter((creator) => [creator.name, creator.handle, creator.email, creator.status].join(' ').toLowerCase().includes(needle))
  }, [creators, query])

  const stats = useMemo(() => ({
    total: creators.length,
    ready: creators.filter((creator) => creator.status === 'ready').length,
    needsReview: creators.filter((creator) => creator.status === 'needs_review').length,
    incomplete: creators.filter((creator) => creator.status === 'incomplete').length,
  }), [creators])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-6">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#7ea400]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label mb-2">Creator ops</p>
          <h1 className="text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.9] text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.065em' }}>
            Review creators before they go live.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6b6b6b]">
            Check portfolio completeness, spot missing proof, and open public profiles before inviting real brands in.
          </p>
        </div>
        <Link href="/ops" className="btn-ghost w-fit border border-[#e8e8e4] px-4 py-2 text-sm">Back to ops</Link>
      </div>

      {error && <div className="card mb-6 border-red-100 bg-red-50 text-sm text-red-700">{error}</div>}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card"><p className="text-xs text-[#8a8a86]">Total creators</p><p className="mt-2 text-3xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>{stats.total}</p></div>
        <div className="card"><p className="text-xs text-[#8a8a86]">Ready</p><p className="mt-2 text-3xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>{stats.ready}</p></div>
        <div className="card"><p className="text-xs text-[#8a8a86]">Needs review</p><p className="mt-2 text-3xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>{stats.needsReview}</p></div>
        <div className="card"><p className="text-xs text-[#8a8a86]">Incomplete</p><p className="mt-2 text-3xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>{stats.incomplete}</p></div>
      </section>

      <div className="card mb-6">
        <label className="flex items-center gap-3 rounded-2xl border border-[#e8e8e4] bg-[#fafaf9] px-4 py-3">
          <Search className="h-4 w-4 text-[#8a8a86]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, handle, email, status..." className="w-full bg-transparent text-sm text-[#363535] outline-none" />
        </label>
      </div>

      <section className="space-y-4 pb-12">
        {filteredCreators.length === 0 ? (
          <div className="card text-sm text-[#6b6b6b]">No creators match this search.</div>
        ) : filteredCreators.map((creator) => (
          <article key={creator.id} className="rounded-[22px] border border-[#e8e8e4] bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(creator.status)}`}>
                    {creator.status === 'ready' ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />}
                    {statusLabel(creator.status)}
                  </span>
                  {creator.handle && <span className="rounded-full bg-[#f4f4f1] px-3 py-1 text-xs font-semibold text-[#6b6b66]">/{creator.handle}</span>}
                </div>
                <h2 className="truncate text-2xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.035em' }}>{creator.name}</h2>
                <p className="mt-1 truncate text-sm text-[#8a8a86]">{creator.email || 'No email found'}</p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
                <div className="rounded-2xl border border-[#eeeeea] bg-[#fafaf9] p-3"><p className="text-xs text-[#8a8a86]">Videos</p><p className="mt-1 font-semibold text-[#363535]"><Video className="mr-1 inline h-4 w-4" />{creator.videoCount}</p></div>
                <div className="rounded-2xl border border-[#eeeeea] bg-[#fafaf9] p-3"><p className="text-xs text-[#8a8a86]">Intro</p><p className="mt-1 font-semibold text-[#363535]">{creator.hasIntroVideo ? 'Yes' : 'No'}</p></div>
                <div className="rounded-2xl border border-[#eeeeea] bg-[#fafaf9] p-3"><p className="text-xs text-[#8a8a86]">Proof</p><p className="mt-1 font-semibold text-[#363535]">{creator.brandLogos + creator.reviews + creator.featuredWork}</p></div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-[#f0f0ec] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[#8a8a86]">
                {creator.missing.length ? <>Missing: <span className="font-semibold text-[#5f5f5a]">{creator.missing.join(', ')}</span></> : 'Profile has the basics for first review.'}
              </div>
              <div className="flex flex-wrap gap-2">
                {creator.publicUrl && <a href={creator.publicUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">Open public profile <ExternalLink className="h-3.5 w-3.5" /></a>}
                <Link href={`/creators/${creator.id}`} className="btn-ghost border border-[#e8e8e4] px-4 py-2 text-sm">Internal view</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
