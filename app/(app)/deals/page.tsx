'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type DealStatus =
  | 'application_sent'
  | 'under_review'
  | 'offered'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'reviewed'
  | 'paid'
  | 'complete'
  | 'archived'
  | 'declined'
  | 'cancelled'
  | string

type Deal = {
  id: string
  status: DealStatus
  created_at: string
  value: number | null
  jobs?: { title?: string } | null
  creators?: { display_name?: string } | null
  brands?: { company_name?: string } | null
}

type DealsResponse = {
  role: 'brand' | 'creator'
  deals: Deal[]
}

const STATUS_STYLES: Record<string, string> = {
  application_sent: 'bg-sky-100 text-sky-700 border-sky-200',
  under_review: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  offered: 'bg-violet-100 text-violet-700 border-violet-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_progress: 'bg-[#ccff00]/20 text-[#1c1c1e] border-[#d6ee76]',
  submitted: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  complete: 'bg-zinc-200 text-zinc-700 border-zinc-300',
  archived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  declined: 'bg-rose-100 text-rose-700 border-rose-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
}

const FILTERS = ['all', 'active', 'completed', 'archived'] as const

function formatMoney(value: number | null) {
  if (value == null) return '—'
  return `£${value.toLocaleString()}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}
    >
      {statusLabel(status)}
    </span>
  )
}

export default function DealsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState<'brand' | 'creator'>('creator')
  const [deals, setDeals] = useState<Deal[]>([])
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/deals', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = (await response.json()) as Partial<DealsResponse> & { error?: string }
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load deals.')
        }

        setRole(payload.role === 'brand' ? 'brand' : 'creator')
        setDeals(Array.isArray(payload.deals) ? payload.deals : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load deals.')
      } finally {
        setLoading(false)
      }
    }

    loadDeals()
  }, [router, supabase])

  const filteredDeals = useMemo(() => {
    const completedStatuses = new Set(['paid', 'complete'])
    const archivedStatuses = new Set(['archived', 'declined', 'cancelled'])

    if (activeFilter === 'completed') {
      return deals.filter((deal) => completedStatuses.has(deal.status))
    }

    if (activeFilter === 'archived') {
      return deals.filter((deal) => archivedStatuses.has(deal.status))
    }

    if (activeFilter === 'active') {
      return deals.filter((deal) => !completedStatuses.has(deal.status) && !archivedStatuses.has(deal.status))
    }

    return deals
  }, [activeFilter, deals])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-7">
        <h1
          style={{
            fontFamily: 'var(--font-bricolage)',
            fontWeight: 600,
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '-2px',
            color: '#1c1c1e',
          }}
        >
          Deals
        </h1>
        <p className="text-sm text-[#6b6b6b] mt-2">
          {deals.length} deal{deals.length === 1 ? '' : 's'} in your pipeline
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize border transition-colors ${
                isActive
                  ? 'bg-[#ccff00] text-[#1c1c1e] border-[#ccff00]'
                  : 'bg-white text-[#6b6b6b] border-[#e8e8e4] hover:text-[#1c1c1e]'
              }`}
            >
              {filter}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      ) : filteredDeals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-[#6b6b6b]">No deals in this view yet.</p>
          <p className="text-xs text-[#9a9a9a] mt-1">
            {role === 'brand'
              ? 'Review applications and extend an offer to start a deal.'
              : 'Apply to jobs and accept offers to move deals forward.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeals.map((deal) => {
            const otherPartyName = role === 'brand' ? deal.creators?.display_name : deal.brands?.company_name
            return (
              <div key={deal.id} className="card card-hover p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-[#1c1c1e] truncate">{deal.jobs?.title || 'Untitled job'}</p>
                    <p className="text-sm text-[#6b6b6b] mt-1 truncate">
                      {role === 'brand' ? 'Creator' : 'Brand'}: {otherPartyName || '—'}
                    </p>
                    <p className="text-xs text-[#9a9a9a] mt-2">
                      Value: {formatMoney(deal.value)} · Created {formatDate(deal.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>

                <div className="mt-4 pt-4 border-t border-[#f0f0ec] flex justify-end">
                  <Link href={`/deals/${deal.id}`} className="btn-primary text-sm">
                    View deal
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
