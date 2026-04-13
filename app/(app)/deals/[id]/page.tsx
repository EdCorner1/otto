'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, MessageCircle, CheckCircle } from 'lucide-react'

type Deal = {
  id: string; status: string; budget: number | null
  submitted_url?: string; submitted_notes?: string
  jobs: {
    id: string; title: string; description: string
    platforms: string[]; deliverables: string[]
    budget_range: string; timeline: string
  }
  creators: {
    id: string; display_name: string; avatar_url?: string
    headline?: string; skills?: string[]; creator_socials?: { platform: string; url: string }[]
  }
  brands: {
    id: string; company_name: string; website?: string; bio?: string
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    proposed: 'bg-blue-50 text-blue-600',
    accepted: 'bg-green-100 text-green-700',
    in_progress: 'bg-[#ccff00]/20 text-[#363535]',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    disputed: 'bg-red-50 text-red-600',
    revision_requested: 'bg-blue-50 text-blue-600',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PlatformBadge({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    'TikTok': '●', 'YouTube Shorts': '●', 'Instagram Reels': '●',
    'Twitter/X': '●', 'LinkedIn': '●', 'YouTube': '●',
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white border border-[#e8e8e4] rounded-full text-[#363535]">
      <span>●</span>
      {platform}
    </span>
  )
}

export default function DealOverviewPage() {
  const params = useParams()
  const dealId = params.id as string
  const [user, setUser] = useState<{ id: string; user_metadata?: { role?: string } } | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: dealData } = await supabase
        .from('deals').select('*, jobs(*), creators(*), brands(*)')
        .eq('id', dealId).single()

      if (!dealData) { setNotFound(true); setLoading(false); return }

      const role = user.user_metadata?.role
      if (role === 'brand' && dealData.brand_id !== user.id) { router.push('/dashboard'); return }
      if (role === 'creator' && dealData.creator_id !== user.id) { router.push('/dashboard'); return }

      setDeal(dealData as Deal)
      setLoading(false)
    }
    getUser()
  }, [dealId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !deal) return (
    <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
      <p className="text-[#6b6b6b]">Deal not found.</p>
      <Link href="/dashboard" className="btn-primary mt-4 inline-block">Back to dashboard</Link>
    </div>
  )

  const isBrand = user?.user_metadata?.role === 'brand'
  const isCreator = user?.user_metadata?.role === 'creator'
  const otherParty = isBrand ? deal.creators : deal.brands
  const otherPartyName = isBrand ? deal.creators?.display_name : deal.brands?.company_name

  return (
    <div className="max-w-2xl mx-auto px-6">

      {/* Back */}
      <div className="mb-6">
        <Link href="/messages" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5">
          ← Messages
        </Link>
      </div>

      {/* Deal header */}
      <div className="card mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)',
              letterSpacing: '-1.5px', color: '#1c1c1e',
            }} className="mb-2">{deal.jobs?.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={deal.status} />
              {deal.budget && (
                <span className="text-sm font-semibold text-[#363535]">£{deal.budget.toLocaleString()}</span>
              )}
              {deal.jobs?.budget_range && !deal.budget && (
                <span className="text-sm text-[#6b6b6b]">{deal.jobs.budget_range}</span>
              )}
            </div>
          </div>
        </div>

        {/* Other party */}
        <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-xl">
          {isBrand && deal.creators?.avatar_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e8e8e4] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deal.creators.avatar_url} alt={deal.creators.display_name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#e8e8e4] flex items-center justify-center text-sm font-bold text-[#9a9a9a] flex-shrink-0">
              {otherPartyName?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#363535]">{otherPartyName}</p>
            {isBrand && (
              <p className="text-xs text-[#6b6b6b]">{deal.creators?.headline || 'Creator'}</p>
            )}
          </div>
          {isBrand && deal.creators && (
            <Link href={`/creators/${deal.creators.id}`} className="btn-ghost text-xs py-1.5 px-3">Profile →</Link>
          )}
        </div>
      </div>

      {/* Brief */}
      {deal.jobs && (
        <div className="card mb-5">
          <h2 style={{ fontSize: '16px', letterSpacing: '-0.5px', color: '#1c1c1e',
          }} className="mb-3">The brief</h2>

          {deal.jobs.platforms && deal.jobs.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {deal.jobs.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          )}

          {deal.jobs.description && (
            <p className="text-sm text-[#6b6b6b] whitespace-pre-wrap leading-relaxed mb-4">
              {deal.jobs.description}
            </p>
          )}

          {deal.jobs.deliverables && deal.jobs.deliverables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider mb-2">Deliverables</p>
              <ul className="space-y-1.5">
                {(deal.jobs.deliverables as string[]).map((d: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#6b6b6b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] mt-2 flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#f0f0ec]">
            {deal.jobs.budget_range && (
              <div>
                <p className="text-xs text-[#9a9a9a] mb-0.5">Budget</p>
                <p className="text-sm font-semibold text-[#363535]">{deal.jobs.budget_range}</p>
              </div>
            )}
            {deal.jobs.timeline && (
              <div>
                <p className="text-xs text-[#9a9a9a] mb-0.5">Timeline</p>
                <p className="text-sm font-semibold text-[#363535]">{deal.jobs.timeline}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submitted work */}
      {deal.submitted_url || deal.submitted_notes ? (
        <div className="card mb-5">
          <h2 style={{ fontSize: '16px', letterSpacing: '-0.5px', color: '#1c1c1e',
          }} className="mb-3">📦 Submitted work</h2>

          {deal.submitted_url && (
            <div className="mb-3">
              <p className="text-xs text-[#9a9a9a] mb-2">Content link</p>
              <a href={deal.submitted_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#363535] bg-[#f0f0ec] hover:bg-[#e8e8e4] px-4 py-2.5 rounded-xl transition-colors break-all">
                              <ExternalLink size={14} />
                <span className="break-all">{deal.submitted_url}</span>
              </a>
            </div>
          )}

          {deal.submitted_notes && (
            <div>
              <p className="text-xs text-[#9a9a9a] mb-2">Creator notes</p>
              <div className="p-4 bg-[#fafaf9] rounded-xl">
                <p className="text-sm text-[#363535] whitespace-pre-wrap leading-relaxed">{deal.submitted_notes}</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Status timeline */}
      <div className="card mb-5">
        <h2 style={{ fontSize: '16px', letterSpacing: '-0.5px', color: '#1c1c1e',
        }} className="mb-4">Deal status</h2>

        <DealTimeline status={deal.status} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/messages/${deal.id}`} className="btn-primary flex-1 text-center inline-flex items-center justify-center gap-2">
          <MessageCircle size={16} /> Message {isBrand ? deal.creators?.display_name?.split(' ')[0] : 'brand'}
        </Link>
        {isBrand && deal.status === 'submitted' && (
          <Link href={`/deals/${deal.id}/brand-review`} className="btn-primary flex-1 text-center inline-flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Review work
          </Link>
        )}
      </div>

    </div>
  )
}

function DealTimeline({ status }: { status: string }) {
  const steps = [
    { key: 'proposed', label: 'Deal proposed' },
    { key: 'accepted', label: 'Creator accepted' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'submitted', label: 'Work submitted', icon: '📦' },
    { key: 'approved', label: 'Approved & paid', icon: '💷' },
  ]

  const doneKeys = ['proposed', 'accepted', 'in_progress', 'submitted', 'approved']
  const currentIndex = doneKeys.indexOf(status)
  const isRevision = status === 'revision_requested' || status === 'disputed'

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isDone = currentIndex > i
        const isCurrent = currentIndex === i
        return (
          <div key={step.key} className="flex items-center gap-3 py-3 border-b border-[#f0f0ec] last:border-0">
            <span className={`text-lg ${isDone ? '' : isCurrent ? '' : 'opacity-30'}`}>
              {step.icon}
            </span>
            <span className={`text-sm flex-1 ${isDone ? 'text-[#363535] font-medium' : isCurrent ? 'text-[#363535]' : 'text-[#9a9a9a]'}`}>
              {step.label}
            </span>
            {isCurrent && !isRevision && (
              <span className="text-xs px-2 py-0.5 bg-[#ccff00]/30 text-[#363535] rounded-full font-medium">Current</span>
            )}
            {isRevision && step.key === 'in_progress' && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Revising</span>
            )}
            {isDone && !isRevision && (
              <span className="text-[#9a9a9a]">✓</span>
            )}
          </div>
        )
      })}
      {isRevision && (
        <div className="flex items-center gap-3 py-3">
          <span className="text-lg">🔁</span>
          <span className="text-sm text-amber-700 font-medium">Revision requested</span>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium ml-auto">In progress</span>
        </div>
      )}
    </div>
  )
}
