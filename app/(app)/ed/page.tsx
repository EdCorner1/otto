'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isEdUser } from '@/lib/ed-auth'

type DashboardClient = {
  id: string
  name: string
  brand_color: string | null
  total_views_month: number
  active_campaigns: number
}

type DashboardPayload = {
  total_views_month: number
  total_videos_month: number
  total_clients: number
  total_active_campaigns: number
  clients: DashboardClient[]
  platform_breakdown: Array<{ platform: string; views: number }>
}

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 650,
  fontSize: 'clamp(28px, 5vw, 42px)',
  lineHeight: 1.02,
  letterSpacing: '-1px',
  color: '#1c1c1e',
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card shadow-sm">
      <p className="text-xs text-[#9a9a9a]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>
        {value}
      </p>
    </div>
  )
}

export default function EdAgencyDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardPayload | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user

        if (!user) {
          router.replace('/login?redirectTo=/ed')
          return
        }

        if (!isEdUser(user)) {
          router.replace('/dashboard')
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) {
          router.replace('/login?redirectTo=/ed')
          return
        }

        const response = await fetch('/api/ed/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        const payload = (await response.json()) as DashboardPayload & { error?: string }
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load dashboard.')
        }

        if (!cancelled) {
          setData(payload)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load dashboard.')
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

  const bigNumber = useMemo(() => (data?.total_views_month || 0).toLocaleString(), [data?.total_views_month])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 pb-8">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="section-label mb-2">Ed command center</p>
          <h1 style={headlineStyle}>Agency performance</h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">Private dashboard for Detris, Clawbite, and future clients.</p>
        </div>
        <Link href="/ed/clients/new" className="btn-primary text-sm px-4 py-2">+ Add Client</Link>
      </div>

      {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Views MTD" value={(data?.total_views_month || 0).toLocaleString()} />
        <StatCard label="Total Videos MTD" value={(data?.total_videos_month || 0).toLocaleString()} />
        <StatCard label="Total Clients" value={(data?.total_clients || 0).toLocaleString()} />
        <StatCard label="Active Campaigns" value={(data?.total_active_campaigns || 0).toLocaleString()} />
      </div>

      <section className="card shadow-sm mb-6">
        <p className="section-label mb-2">Monthly views</p>
        <div className="flex flex-wrap items-end gap-4">
          <p className="text-5xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{bigNumber}</p>
          <p className="text-sm text-[#8a8a86]">MoM comparison coming soon</p>
        </div>
      </section>

      <section className="card shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-label mb-1">Clients</p>
            <h2 className="text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Client performance this month</h2>
          </div>
        </div>

        {(data?.clients || []).length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No client data yet. Add your first client to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.clients.map((client) => (
              <Link key={client.id} href={`/ed/clients/${client.id}`} className="rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-4 hover:shadow-md transition-shadow">
                <div className="h-1 w-full rounded-full mb-3" style={{ backgroundColor: client.brand_color || '#ccff00' }} />
                <p className="text-lg font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{client.name}</p>
                <p className="mt-1 text-sm text-[#6b6b6b]">Views MTD: {(client.total_views_month || 0).toLocaleString()}</p>
                <p className="text-sm text-[#6b6b6b]">Active campaigns: {client.active_campaigns || 0}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card shadow-sm">
        <p className="section-label mb-2">Platform breakdown</p>
        {(data?.platform_breakdown || []).length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No platform data this month yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data?.platform_breakdown.map((row) => (
              <div key={row.platform} className="rounded-xl border border-[#efefea] bg-[#fafaf9] px-4 py-3">
                <p className="text-sm text-[#6b6b6b]">{row.platform}</p>
                <p className="text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{row.views.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
