'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, CheckCircle, RotateCcw } from 'lucide-react'

type Deal = {
  id: string; status: string; budget: number | null
  submitted_url?: string; submitted_notes?: string
  jobs: { id: string; title: string; description: string; deliverables: string[] }
  creators: { id: string; display_name: string; avatar_url?: string; creator_socials?: { platform: string; url: string }[] }
  brands: { id: string; company_name: string }
}

export default function BrandDealReviewPage() {
  const params = useParams()
  const dealId = params.id as string
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [done, setDone] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.user_metadata?.role !== 'brand') { router.push('/dashboard'); return }
      setUser(user)

      const { data: brandData } = await supabase.from('brands').select('id').eq('user_id', user.id).single()
      if (!brandData) { router.push('/dashboard'); return }

      const { data: dealData } = await supabase
        .from('deals').select('*, jobs(*), creators(*), brands(*)')
        .eq('id', dealId).single()
      if (!dealData || dealData.brand_id !== brandData.id) { router.push('/dashboard'); return }
      setDeal(dealData as Deal)
      setLoading(false)
    }
    getUser()
  }, [dealId])

  const handleApprove = async () => {
    if (!deal) return
    setActioning(true)
    await supabase.from('deals').update({ status: 'approved' }).eq('id', deal.id)
    await supabase.from('messages').insert({
      deal_id: deal.id,
      sender_id: user!.id,
      sender_name: deal.brands?.company_name || 'Brand',
      content: '✅ Work approved! Payment will be released shortly.',
    })
    setDeal(prev => prev ? { ...prev, status: 'approved' } : null)
    setDone('approved')
    setActioning(false)
  }

  const handleRevision = async () => {
    if (!deal) return
    setActioning(true)
    await supabase.from('deals').update({ status: 'revision_requested' }).eq('id', deal.id)
    await supabase.from('messages').insert({
      deal_id: deal.id,
      sender_id: user!.id,
      sender_name: deal.brands?.company_name || 'Brand',
      content: '🔁 I\'d like one round of revisions. Check the brief and let me know if you have questions.',
    })
    setDeal(prev => prev ? { ...prev, status: 'revision_requested' } : null)
    setDone('revision')
    setActioning(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!deal) return (
    <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
      <p className="text-[#6b6b6b]">Deal not found.</p>
      <Link href="/dashboard" className="btn-primary mt-4 inline-block">Back to dashboard</Link>
    </div>
  )

  const creator = deal.creators

  return (
    <div className="max-w-2xl mx-auto px-6">

      {/* Back */}
      <div className="mb-6">
        <Link href="/messages" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5">
          ← Messages
        </Link>
      </div>

      {/* Deal card */}
      <div className="card mb-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)',
              letterSpacing: '-1.5px', color: '#1c1c1e',
            }} className="mb-1">{deal.jobs?.title}</h1>
            <div className="flex items-center gap-3 text-xs text-[#9a9a9a]">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                ${deal.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                  deal.status === 'approved' ? 'bg-green-100 text-green-700' :
                  deal.status === 'revision_requested' ? 'bg-blue-50 text-blue-600' :
                  'bg-[#e8e8e4] text-[#6b6b6b]'}`}>
                {deal.status.replace('_', ' ')}
              </span>
              <span>£{deal.budget?.toLocaleString()} budget</span>
            </div>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-3 p-3 bg-[#fafaf9] rounded-xl mb-5">
          {creator?.avatar_url ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e8e8e4] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#e8e8e4] flex items-center justify-center text-sm font-bold text-[#9a9a9a] flex-shrink-0">
              {creator?.display_name?.[0] ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#363535]">{creator?.display_name}</p>
            <Link href={`/creators/${creator?.id}`} className="text-xs text-[#6b6b6b] hover:text-[#363535]">View profile →</Link>
          </div>
        </div>

        {/* Brief reminder */}
        {deal.jobs?.description && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider mb-2">Original brief</p>
            <p className="text-sm text-[#6b6b6b] whitespace-pre-wrap leading-relaxed">{deal.jobs.description}</p>
          </div>
        )}

        {/* Deliverables reminder */}
        {deal.jobs?.deliverables && deal.jobs.deliverables.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider mb-2">Expected deliverables</p>
            <ul className="space-y-1.5">
              {(deal.jobs.deliverables as string[]).map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#6b6b6b]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] mt-2 flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Submitted work */}
      {deal.status === 'submitted' && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📦</span>
            <h2 style={{ fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e',
            }}>
              Submitted work
            </h2>
          </div>

          {deal.submitted_url ? (
            <div className="mb-4">
              <p className="text-xs text-[#9a9a9a] mb-2">Content link</p>
              <a href={deal.submitted_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#363535] bg-[#f0f0ec] hover:bg-[#e8e8e4] px-4 py-2.5 rounded-xl transition-colors break-all">
              <ExternalLink size={14} />
                <span className="break-all">{deal.submitted_url}</span>
              </a>
            </div>
          ) : (
            <p className="text-sm text-[#9a9a9a] italic mb-4">No content link provided.</p>
          )}

          {deal.submitted_notes && (
            <div className="mb-4">
              <p className="text-xs text-[#9a9a9a] mb-2">Creator notes</p>
              <div className="p-4 bg-[#fafaf9] rounded-xl">
                <p className="text-sm text-[#363535] whitespace-pre-wrap leading-relaxed">{deal.submitted_notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-[#f0f0ec] pt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApprove}
              disabled={actioning}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actioning && done === 'approved' ? (
                <><span className="w-4 h-4 border-2 border-[#1c1c1e]/30 border-t-[#1c1c1e] rounded-full animate-spin" /> Approving...</>
              ) : <><CheckCircle size={16} /> Approve & release payment</>}
            </button>
            <button
              onClick={handleRevision}
              disabled={actioning}
              className="btn-ghost flex-1"
            >
              {actioning && done === 'revision' ? 'Sending...' : <><RotateCcw size={16} /> Request revision</>}
            </button>
            <Link href={`/messages/${deal.id}`} className="btn-ghost">Message creator</Link>
          </div>
        </div>
      )}

      {/* Approved state */}
      {deal.status === 'approved' && (
        <div className="card text-center py-8">
          <div className="mb-3 flex justify-center"><CheckCircle size={40} className="text-green-600" /></div>
          <h2 style={{ fontSize: '22px', letterSpacing: '-0.5px', color: '#1c1c1e',
          }} className="mb-2">Work approved!</h2>
          <p className="text-sm text-[#6b6b6b] mb-6">Payment has been released to the creator.</p>
          <Link href="/messages" className="btn-ghost">← Back to messages</Link>
        </div>
      )}

      {/* Revision requested */}
      {deal.status === 'revision_requested' && (
        <div className="card text-center py-8">
          <div className="mb-3 flex justify-center"><RotateCcw size={40} className="text-blue-500" /></div>
          <h2 style={{ fontSize: '22px', letterSpacing: '-0.5px', color: '#1c1c1e',
          }} className="mb-2">Revision requested</h2>
          <p className="text-sm text-[#6b6b6b] mb-6">The creator has been notified. Check messages for updates.</p>
          <Link href={`/messages/${deal.id}`} className="btn-primary">Message creator</Link>
        </div>
      )}

      {/* In progress */}
      {!['submitted', 'approved', 'revision_requested'].includes(deal.status) && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-3">⏳</div>
          <h2 style={{ fontSize: '22px', letterSpacing: '-0.5px', color: '#1c1c1e',
          }} className="mb-2">Work in progress</h2>
          <p className="text-sm text-[#6b6b6b] mb-6">The creator is still working on this. You&apos;ll be notified when it&apos;s submitted.</p>
          <Link href={`/messages/${deal.id}`} className="btn-ghost">Message creator</Link>
        </div>
      )}

    </div>
  )
}
