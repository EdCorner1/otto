'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Deal = {
  id: string; brand_id: string; creator_id: string; job_id: string
  amount: string; status: string; brand_paid: boolean
  created_at: string; updated_at: string
  jobs: { id: string; title: string; description: string; deliverables: string }
  brands: { id: string; company_name: string; logo_url?: string }
  creators: { id: string; display_name: string; avatar_url?: string; bio?: string; user_id: string }
}

type Message = {
  id: string; sender_id: string; sender_name: string; content: string; created_at: string
}

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  lineHeight: 1.0,
  letterSpacing: '-2px',
  color: '#363535',
}

interface UserState { id: string; email?: string; user_metadata?: Record<string, unknown> }
export default function DealReviewPage() {
  const params = useParams()
  const dealId = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserState | null>(null)
  const [brand, setBrand] = useState<{ id: string; company_name?: string } | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [approved, setApproved] = useState(false)

  // Load deal + messages
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: brandData } = await supabase
        .from('brands').select('id, user_id, company_name').eq('user_id', user.id).single()

      if (!brandData) { router.push('/dashboard'); return }
      setUser(user)
      setBrand(brandData)

      const { data: dealData } = await supabase
        .from('deals').select(`
          *,
          jobs(title, description, deliverables),
          brands(id, company_name, logo_url),
          creators(id, display_name, avatar_url, bio, user_id)
        `).eq('id', dealId).single()

      if (!dealData) { router.push('/messages'); return }
      if (dealData.brand_id !== brandData.id) { router.push('/messages'); return }

      const { data: msgs } = await supabase
        .from('messages').select('*').eq('deal_id', dealId)
        .order('created_at', { ascending: true }).limit(100)

      setDeal(dealData as Deal)
      setMessages((msgs as Message[]) || [])
      if (dealData.status === 'approved') setApproved(true)
      setLoading(false)
    }
    load()
  }, [dealId])

  // Find submission message
  const submissionMsg = messages.find(m => m.content.startsWith('Work submitted'))
  const submissionLink = submissionMsg?.content.match(/https?:\/\/[^\s]+/)?.[0] || ''
  const submissionNotes = submissionMsg
    ? submissionMsg.content.replace(/^Work submitted.*?(?::\s*https?:\/\/[^\s]+)?\s*(?:—\s*(.+))?$/, '$1').trim()
    : ''

  const updateDeal = async (newStatus: string) => {
    if (!deal) return
    setUpdating(true)
    await supabase.from('deals').update({ status: newStatus }).eq('id', deal.id)
    setDeal(prev => prev ? { ...prev, status: newStatus } : null)
    setUpdating(false)
  }

  const sendRevisionNote = async () => {
    if (!revisionNotes.trim() || !deal) return
    const senderName = brand?.company_name || 'Brand'
    await supabase.from('messages').insert({
      deal_id: deal.id, sender_id: user!.id, sender_name: senderName,
      content: `🔁 Revision requested: ${revisionNotes.trim()}`,
    })
    await updateDeal('in_progress')
    setRevisionNotes('')
    setShowRevisionForm(false)
  }

  const handleApprove = async () => {
    await updateDeal('approved')
    if (deal) {
      const senderName = brand?.company_name || 'Brand'
      await supabase.from('messages').insert({
        deal_id: deal.id, sender_id: user!.id, sender_name: senderName,
        content: '✅ Work approved! Payment will be released shortly.',
      })
    }
    setApproved(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!deal) return null

  const creator = deal.creators
  const job = deal.jobs

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Page content */}
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#ccff00] bg-[#ccff00]/10 px-2 py-0.5 rounded-full">Deal Review</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              deal.status === 'submitted' ? 'bg-amber-50 text-amber-700' :
              deal.status === 'approved' ? 'bg-green-50 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>{deal.status}</span>
          </div>
          <h1 style={{ ...headlineStyle, fontSize: 'clamp(24px, 4vw, 36px)' }}>{job?.title || 'Brief'}</h1>
        </div>

        {/* Submitted work */}
        {submissionMsg && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#ccff00] flex items-center justify-center text-sm">🎬</div>
              <div>
                <p className="font-semibold text-sm text-[#363535]">{creator?.display_name} submitted their work</p>
                <p className="text-xs text-[#9a9a9a]">{new Date(submissionMsg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {submissionLink && (
              <a href={submissionLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-[#fafaf9] rounded-xl border border-[#e8e8e4] mb-3 hover:border-[#ccff00] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[#1c1c1c] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg ml-0.5">▶️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#363535] group-hover:text-[#1c1c1c] truncate">{submissionLink}</p>
                  <p className="text-xs text-[#9a9a9a]">Click to view submitted work</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}

            {submissionNotes && submissionNotes !== submissionLink && (
              <div className="p-3 bg-[#fafaf9] rounded-xl border border-[#e8e8e4]">
                <p className="text-xs font-semibold text-[#6b6b6b] mb-1">Creator&apos;s notes</p>
                <p className="text-sm text-[#363535]">{submissionNotes}</p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#e8e8e4] pt-3 mt-3">
              <span className="text-sm text-[#6b6b6b]">Deal value</span>
              <span className="text-lg font-bold text-[#363535]">£{deal.amount}</span>
            </div>
          </div>
        )}

        {!submissionMsg && deal.status !== 'approved' && (
          <div className="card mb-6 text-center py-8">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm text-[#6b6b6b]">Waiting for the creator to submit their work.</p>
            <Link href={`/messages/${deal.id}`} className="btn-ghost text-sm mt-4 inline-flex items-center gap-2">Message Creator →</Link>
          </div>
        )}

        {/* Creator */}
        <Link href={`/creators/${creator?.id}`}
          className="card flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all group mb-6">
          {creator?.avatar_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e8e8e4] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#f0f0ec] border-2 border-dashed border-[#d0d0cc] flex items-center justify-center text-lg flex-shrink-0">
              {creator?.display_name?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[#363535] group-hover:text-[#1c1c1c]">{creator?.display_name}</p>
            {creator?.bio && <p className="text-xs text-[#6b6b6b] line-clamp-1">{creator.bio}</p>}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </Link>

        {/* What was agreed */}
        <div className="card mb-6">
          <h2 style={{ ...headlineStyle, fontSize: '18px' }} className="mb-3">What was agreed</h2>
          <div className="space-y-3">
            {job?.deliverables && (
              <div>
                <p className="text-xs font-semibold text-[#6b6b6b] mb-1">Deliverables</p>
                <p className="text-sm text-[#363535]">{job.deliverables}</p>
              </div>
            )}
            {job?.description && (
              <div>
                <p className="text-xs font-semibold text-[#6b6b6b] mb-1">Brief</p>
                <p className="text-sm text-[#363535] line-clamp-3">{job.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approved state */}
        {approved && (
          <div className="card text-center py-8 mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
            </div>
            <h2 style={{ ...headlineStyle, fontSize: '22px' }} className="mb-2">Work Approved!</h2>
            <p className="text-sm text-[#6b6b6b]">Payment will be released to the creator. Reach out to confirm receipt.</p>
            <Link href={`/messages/${deal.id}`} className="btn-primary inline-flex items-center gap-2 mt-5 px-6 py-3">
              Message Creator →
            </Link>
          </div>
        )}

        {/* Revision form */}
        {showRevisionForm && (
          <div className="card mb-6">
            <h2 style={{ ...headlineStyle, fontSize: '18px' }} className="mb-3">Request Changes</h2>
            <p className="text-sm text-[#6b6b6b] mb-4">Be specific. The creator will be notified immediately.</p>
            <textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
              placeholder="Example: The video needs to be under 60 seconds and include a call-to-action at the end..."
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00] resize-none mb-3" />
            <div className="flex gap-2">
              <button onClick={sendRevisionNote} disabled={!revisionNotes.trim() || updating}
                className="btn-primary text-sm disabled:opacity-50">Send Revision Request</button>
              <button onClick={() => setShowRevisionForm(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!approved && !showRevisionForm && submissionMsg && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleApprove} disabled={updating}
              className="btn-primary disabled:opacity-50 inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
              Approve & Release Payment
            </button>
            <button onClick={() => setShowRevisionForm(true)} disabled={updating} className="btn-ghost disabled:opacity-50">
              Request Changes
            </button>
            <Link href={`/messages/${deal.id}`} className="btn-ghost text-sm ml-auto">Message Creator →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
