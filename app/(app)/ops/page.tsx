'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const OWNER_EMAILS = ['edcorner1@gmail.com']

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 42px)',
  lineHeight: 1.0,
  letterSpacing: '-0.5px',
  color: '#363535',
}

type WaitlistRow = {
  id: string
  email: string
  role: 'creator' | 'brand'
  signed_up_at: string | null
}

type OpsData = {
  waitlistTotal: number
  creatorWaitlist: number
  brandWaitlist: number
  accountsTotal: number
  creatorsLive: number
  brandsLive: number
  jobsLive: number
  dealsTotal: number
  draftPosts: number
  inReviewPosts: number
  publishedPosts: number
  gmvTotal: number
  recentWaitlist: WaitlistRow[]
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <p className="text-xs text-[#9a9a9a]">{label}</p>
      <p className="text-3xl font-semibold text-[#363535] mt-2" style={{ fontFamily: 'var(--font-bricolage)' }}>
        {value}
      </p>
      {hint ? <p className="text-xs text-[#8a8a86] mt-2">{hint}</p> : null}
    </div>
  )
}

export default function OpsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState<OpsData>({
    waitlistTotal: 0,
    creatorWaitlist: 0,
    brandWaitlist: 0,
    accountsTotal: 0,
    creatorsLive: 0,
    brandsLive: 0,
    jobsLive: 0,
    dealsTotal: 0,
    draftPosts: 0,
    inReviewPosts: 0,
    publishedPosts: 0,
    gmvTotal: 0,
    recentWaitlist: [],
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.replace('/login?redirectTo=/ops')
        return
      }

      const ownerEmail = (user.email || '').toLowerCase()
      setEmail(ownerEmail)

      if (!OWNER_EMAILS.includes(ownerEmail)) {
        router.replace('/dashboard')
        return
      }

      try {
        const [
          waitlistTotalRes,
          creatorWaitlistRes,
          brandWaitlistRes,
          accountsTotalRes,
          creatorsLiveRes,
          brandsLiveRes,
          jobsLiveRes,
          dealsCountRes,
          dealBudgetsRes,
          draftPostsRes,
          inReviewPostsRes,
          publishedPostsRes,
          recentWaitlistRes,
        ] = await Promise.all([
          supabase.from('waitlist').select('id', { count: 'exact', head: true }),
          supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('role', 'creator'),
          supabase.from('waitlist').select('id', { count: 'exact', head: true }).eq('role', 'brand'),
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('creators').select('id', { count: 'exact', head: true }),
          supabase.from('brands').select('id', { count: 'exact', head: true }),
          supabase.from('jobs').select('id', { count: 'exact', head: true }),
          supabase.from('deals').select('id', { count: 'exact', head: true }),
          supabase.from('deals').select('budget, status'),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'in_review'),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('waitlist').select('id, email, role, signed_up_at').order('signed_up_at', { ascending: false }).limit(8),
        ])

        const gmvTotal = (dealBudgetsRes.data || []).reduce((sum, deal) => sum + (Number(deal.budget) || 0), 0)

        if (!cancelled) {
          setData({
            waitlistTotal: waitlistTotalRes.count || 0,
            creatorWaitlist: creatorWaitlistRes.count || 0,
            brandWaitlist: brandWaitlistRes.count || 0,
            accountsTotal: accountsTotalRes.count || 0,
            creatorsLive: creatorsLiveRes.count || 0,
            brandsLive: brandsLiveRes.count || 0,
            jobsLive: jobsLiveRes.count || 0,
            dealsTotal: dealsCountRes.count || 0,
            draftPosts: draftPostsRes.count || 0,
            inReviewPosts: inReviewPostsRes.count || 0,
            publishedPosts: publishedPostsRes.count || 0,
            gmvTotal,
            recentWaitlist: (recentWaitlistRes.data as WaitlistRow[]) || [],
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load ops data right now.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  const conversionRate = useMemo(() => {
    if (!data.waitlistTotal) return 0
    return Math.round((data.accountsTotal / data.waitlistTotal) * 100)
  }, [data.accountsTotal, data.waitlistTotal])

  const nextMoves = useMemo(() => {
    const items: Array<{ title: string; body: string; href: string; cta: string }> = []

    if (data.creatorWaitlist > data.creatorsLive) {
      items.push({
        title: 'Turn waitlist creators into full profiles',
        body: `${Math.max(data.creatorWaitlist - data.creatorsLive, 0)} creators are still waiting to move from signup into real creator profiles.`,
        href: '/creators/welcome',
        cta: 'Review creator onboarding',
      })
    }

    if (data.brandWaitlist > data.brandsLive) {
      items.push({
        title: 'Bring the first brands through onboarding',
        body: `${Math.max(data.brandWaitlist - data.brandsLive, 0)} brands are still in waitlist mode with no live brand profile yet.`,
        href: '/brands/welcome',
        cta: 'Review brand onboarding',
      })
    }

    if (data.jobsLive === 0) {
      items.push({
        title: 'Seed the marketplace with live briefs',
        body: 'There are no live jobs yet. A few strong sample briefs will make the product feel real fast.',
        href: '/jobs/new',
        cta: 'Post a sample brief',
      })
    }

    if (data.publishedPosts === 0) {
      items.push({
        title: 'Publish proof of progress',
        body: 'Use content to show the market what Otto is becoming while the platform is still taking shape.',
        href: '/cms',
        cta: 'Open content hub',
      })
    }

    return items.slice(0, 4)
  }, [data])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="mb-10 fade-up">
        <p className="section-label mb-2">Owner dashboard</p>
        <h1 style={headlineStyle}>Run Otto from one place.</h1>
        <p className="text-[#6b6b6b] mt-3 text-sm max-w-2xl">
          Live view of waitlist demand, product readiness, content momentum, and what needs pushing next.
        </p>
        {email ? <p className="text-xs text-[#9a9a9a] mt-2">Signed in as {email}</p> : null}
      </div>

      {error ? (
        <div className="card mb-6 border-red-100 bg-red-50 text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10 fade-up stagger-1">
        <StatCard label="Waitlist total" value={data.waitlistTotal.toLocaleString()} hint="Real demand captured so far" />
        <StatCard label="Creators waiting" value={data.creatorWaitlist.toLocaleString()} hint="Potential launch-side supply" />
        <StatCard label="Brands waiting" value={data.brandWaitlist.toLocaleString()} hint="Potential launch-side demand" />
        <StatCard label="Accounts created" value={data.accountsTotal.toLocaleString()} hint={`${conversionRate}% of waitlist converted`} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10 fade-up stagger-2">
        <StatCard label="Creator profiles live" value={data.creatorsLive.toLocaleString()} />
        <StatCard label="Brand profiles live" value={data.brandsLive.toLocaleString()} />
        <StatCard label="Live briefs" value={data.jobsLive.toLocaleString()} />
        <StatCard label="GMV tracked" value={`£${data.gmvTotal.toLocaleString()}`} hint={`${data.dealsTotal} deal${data.dealsTotal === 1 ? '' : 's'} created`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 fade-up stagger-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-label mb-2">Needs attention</p>
              <h2 className="text-2xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>
                Highest-leverage next moves
              </h2>
            </div>
          </div>

          {nextMoves.length === 0 ? (
            <p className="text-sm text-[#6b6b6b]">No urgent product gaps are standing out right now.</p>
          ) : (
            <div className="space-y-4">
              {nextMoves.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#e8e8e4] bg-[#fafaf9] p-5">
                  <p className="font-semibold text-[#363535] mb-1">{item.title}</p>
                  <p className="text-sm text-[#6b6b6b] mb-4">{item.body}</p>
                  <Link href={item.href} className="btn-primary text-sm px-4 py-2">
                    {item.cta} →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <p className="section-label mb-2">Content engine</p>
          <h2 className="text-2xl font-semibold text-[#363535] mb-5" style={{ fontFamily: 'var(--font-bricolage)' }}>
            What’s ready to publish
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#fafaf9] px-4 py-3 border border-[#f0f0ec]">
              <span className="text-sm text-[#6b6b6b]">Draft posts</span>
              <span className="text-lg font-semibold text-[#363535]">{data.draftPosts}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#fafaf9] px-4 py-3 border border-[#f0f0ec]">
              <span className="text-sm text-[#6b6b6b]">In review</span>
              <span className="text-lg font-semibold text-[#363535]">{data.inReviewPosts}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#fafaf9] px-4 py-3 border border-[#f0f0ec]">
              <span className="text-sm text-[#6b6b6b]">Published</span>
              <span className="text-lg font-semibold text-[#363535]">{data.publishedPosts}</span>
            </div>
          </div>

          <Link href="/cms" className="btn-ghost mt-5 text-sm px-4 py-2">
            Open content hub →
          </Link>
        </div>
      </section>

      <section className="card fade-up stagger-4">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <p className="section-label mb-2">Waitlist activity</p>
            <h2 className="text-2xl font-semibold text-[#363535]" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Latest signups
            </h2>
          </div>
          <Link href="/creators/welcome" className="btn-ghost text-sm px-4 py-2">
            Preview creator onboarding →
          </Link>
        </div>

        {data.recentWaitlist.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No waitlist signups yet.</p>
        ) : (
          <div className="space-y-3">
            {data.recentWaitlist.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#f0f0ec] bg-[#fafaf9] px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#363535] truncate">{row.email}</p>
                  <p className="text-xs text-[#9a9a9a] mt-1">{row.signed_up_at ? new Date(row.signed_up_at).toLocaleString() : 'Signed up recently'}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.role === 'creator' ? 'bg-[#ccff00]/20 text-[#363535]' : 'bg-[#f0f0ec] text-[#6b6b6b]'}`}>
                  {row.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
