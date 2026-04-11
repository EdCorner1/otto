'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(20px, 4vw, 28px)',
  lineHeight: 1.0,
  letterSpacing: '-2px',
  color: '#363535',
}

interface UserState { id: string; email?: string; user_metadata?: Record<string, unknown> }
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    proposed: 'bg-blue-50 text-blue-600',
    accepted: 'bg-green-100 text-green-700',
    in_progress: 'bg-[#ccff00]/20 text-[#363535]',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    disputed: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Message = {
  id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

type Deal = {
  id: string
  amount: number
  status: string
  brand_id: string
  creator_id: string
  jobs: { title: string }
  brands: { company_name: string }
  creators: { display_name: string }
  messages: Message[]
}

export default function DealThreadPage() {
  const params = useParams()
  const dealId = params.deal_id as string
  const [user, setUser] = useState<UserState | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [submissionLink, setSubmissionLink] = useState('')
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [profileId, setProfileId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      setRole(user.user_metadata?.role)

      if (user.user_metadata?.role === 'brand') {
        const { data: brandData } = await supabase.from('brands').select('id').eq('user_id', user.id).single()
        if (!brandData) { router.push('/dashboard'); return }
        setProfileId(brandData.id)

        const { data: dealData } = await supabase.from('deals').select('*, jobs(title), creators(display_name), brands(company_name)').eq('id', dealId).single()
        if (!dealData || dealData.brand_id !== brandData.id) { router.push('/messages'); return }

        const { data: msgs } = await supabase.from('messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: true }).limit(100)
        setDeal(dealData as Deal)
        setMessages((msgs as Message[]) || [])
      } else {
        const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
        if (!creatorData) { router.push('/dashboard'); return }
        setProfileId(creatorData.id)

        const { data: dealData } = await supabase.from('deals').select('*, jobs(title), creators(display_name), brands(company_name)').eq('id', dealId).single()
        if (!dealData || dealData.creator_id !== creatorData.id) { router.push('/messages'); return }

        const { data: msgs } = await supabase.from('messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: true }).limit(100)
        setDeal(dealData as Deal)
        setMessages((msgs as Message[]) || [])
      }

      setLoading(false)
    }
    getUser()
  }, [dealId])

  useEffect(() => {
    if (!dealId) return

    const channel = supabase.channel(`deal-${dealId}`).on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `deal_id=eq.${dealId}` },
      (payload: { new: Message }) => {
        setMessages(prev => [...prev, payload.new as Message])
      }
    ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [dealId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const senderName = role === 'brand' ? (deal?.brands?.company_name || 'Brand') : (deal?.creators?.display_name || 'Creator')

    await supabase.from('messages').insert({
      deal_id: dealId,
      sender_id: user!.id,
      sender_name: senderName,
      content: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
    setTimeout(scrollToBottom, 100)
  }

  const updateDealStatus = async (newStatus: string) => {
    if (!deal) return
    await supabase.from('deals').update({ status: newStatus }).eq('id', deal.id)
    setDeal(prev => prev ? { ...prev, status: newStatus } : null)
  }

  const notify = async (event: string, data: object) => {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
      })
    } catch (e) { /* non-critical */ }
  }

  const submitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('deals').update({ status: 'submitted', submitted_url: submissionLink || null, submitted_notes: submissionNotes || null }).eq('id', deal?.id)
    setDeal(prev => prev ? { ...prev, status: 'submitted' } : null)
    setShowSubmitForm(false)

    const senderName = role === 'brand' ? (deal?.brands?.company_name || 'Brand') : (deal?.creators?.display_name || 'Creator')
    await supabase.from('messages').insert({
      deal_id: dealId,
      sender_id: user!.id,
      sender_name: senderName,
      content: `Work submitted${submissionLink ? `: ${submissionLink}` : ''}${submissionNotes ? ` — ${submissionNotes}` : ''}`,
    })

    // Notify brand that work is in
    if (role === 'creator') {
      notify('work_submitted', {
        dealId,
        brandId: deal?.brand_id,
        creatorId: deal?.creator_id,
        jobTitle: deal?.jobs?.title,
        creatorName: deal?.creators?.display_name,
      })
    }

    setSubmissionLink('')
    setSubmissionNotes('')
  }

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!deal) return null

  const otherParty = role === 'brand'
    ? deal.creators?.display_name || 'Creator'
    : deal.brands?.company_name || 'Brand'

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">

      {/* Header */}
      <div className="pt-28 pb-4 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <h1 style={headlineStyle}>{otherParty}</h1>
                <p className="text-sm text-[#6b6b6b] mt-0.5">{deal.jobs?.title}</p>
              </div>
              <div className="ml-auto flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={deal.status} />
                <span className="text-sm font-semibold text-[#363535]">£{deal.amount}</span>
              </div>
            </div>

            {/* Deal action buttons */}
            {deal.status === 'proposed' && role === 'creator' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#e8e8e4]">
                <button onClick={() => updateDealStatus('in_progress')} className="btn-primary text-sm">Accept Deal</button>
                <button onClick={() => updateDealStatus('declined')} className="btn-ghost text-sm">Decline</button>
              </div>
            )}
            {deal.status === 'in_progress' && role === 'creator' && !showSubmitForm && (
              <div className="mt-4 pt-4 border-t border-[#e8e8e4]">
                <button onClick={() => setShowSubmitForm(true)} className="btn-primary text-sm">Submit Work</button>
              </div>
            )}
            {showSubmitForm && (
              <form onSubmit={submitWork} className="mt-4 pt-4 border-t border-[#e8e8e4] space-y-3">
                <input
                  type="url"
                  value={submissionLink}
                  onChange={e => setSubmissionLink(e.target.value)}
                  placeholder="Link to your work (YouTube, Google Drive, etc.)"
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <textarea
                  value={submissionNotes}
                  onChange={e => setSubmissionNotes(e.target.value)}
                  placeholder="Notes about your submission..."
                  rows={2}
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm">Confirm Submission</button>
                  <button type="button" onClick={() => setShowSubmitForm(false)} className="btn-ghost text-sm">Cancel</button>
                </div>
              </form>
            )}
            {deal.status === 'submitted' && role === 'brand' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#e8e8e4]">
                <button onClick={async () => {
                  await updateDealStatus('approved')
                  notify('deal_approved', {
                    dealId,
                    creatorId: deal?.creator_id,
                    jobTitle: deal?.jobs?.title,
                    brandName: deal?.brands?.company_name,
                  })
                }} className="btn-primary text-sm">Approve Work</button>
                <Link href={`/deals/${dealId}/review`} className="btn-ghost text-sm">Request Changes</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3 pb-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user!.id
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isOwn
                      ? 'bg-[#ccff00] text-[#1c1c1c] rounded-br-md'
                      : 'bg-white border border-[#e8e8e4] text-[#363535] rounded-bl-md'
                    }`}>
                    {!isOwn && <p className="text-xs font-semibold text-[#6b6b6b] mb-1">{msg.sender_name}</p>}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-[#1c1c1c]/50' : 'text-[#9a9a9a]'}`}>{formatTimestamp(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={sendMessage} className="bg-white border border-[#e8e8e4] rounded-2xl p-3 flex gap-2 items-end">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#363535] placeholder-[#9a9a9a] focus:outline-none resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).form?.requestSubmit() } }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary text-sm py-2 px-4 flex-shrink-0 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
