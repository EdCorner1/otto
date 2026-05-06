'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type DealStatus =
  | 'application_sent'
  | 'under_review'
  | 'offered'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'reviewed'
  | 'revision_requested'
  | 'paid'
  | 'complete'
  | 'archived'
  | 'declined'
  | 'cancelled'
  | string

type Deal = {
  id: string
  job_id: string | null
  creator_id?: string | null
  status: DealStatus
  value: number | null
  submitted_url?: string | null
  submitted_notes?: string | null
  jobs?: { title?: string; description?: string } | null
  brands?: { company_name?: string } | null
  creators?: { display_name?: string; avatar_url?: string } | null
}

type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested'

type Deliverable = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes?: string | null
  status: DeliverableStatus
  submitted_at: string
  created_at: string
}

type Application = {
  id: string
  status: string
  message?: string | null
  proposed_rate?: number | null
  creators?: {
    id?: string
    display_name?: string
    avatar_url?: string
    headline?: string
  } | null
}

type Message = {
  id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

type DealResponse = {
  role: 'brand' | 'creator'
  deal: Deal
  applications: Application[]
}

type MessagesResponse = {
  messages: Message[]
}

type DeliverablesResponse = {
  deliverables: Deliverable[]
  storage?: 'table' | 'messages_fallback'
}

const FLOW: DealStatus[] = [
  'application_sent',
  'under_review',
  'offered',
  'accepted',
  'in_progress',
  'submitted',
  'reviewed',
  'paid',
  'complete',
]

const STATUS_STYLES: Record<string, string> = {
  application_sent: 'bg-sky-100 text-sky-700 border-sky-200',
  under_review: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  offered: 'bg-violet-100 text-violet-700 border-violet-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_progress: 'bg-[#ccff00]/20 text-[#1c1c1e] border-[#d6ee76]',
  submitted: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  revision_requested: 'bg-orange-100 text-orange-700 border-orange-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  complete: 'bg-zinc-200 text-zinc-700 border-zinc-300',
  archived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function deliverableStatusLabel(status: DeliverableStatus) {
  if (status === 'revision_requested') return 'Revision requested'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function deliverableStatusClass(status: DeliverableStatus) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (status === 'revision_requested') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-amber-100 text-amber-700 border-amber-200'
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}
    >
      {statusLabel(status)}
    </span>
  )
}

function parseMessageType(content: string): { type: 'chat' | 'brief' | 'asset' | 'submission' | 'payment' | 'review' | 'offer' | 'system'; text: string } {
  const match = content.match(/^\[SYSTEM:([^\]]+)\]\s*/)
  if (!match) return { type: 'chat', text: content }

  const rawType = match[1]?.trim() || 'system'
  const text = content.replace(/^\[SYSTEM:[^\]]+\]\s*/, '').trim()

  if (rawType === 'brief' || rawType === 'asset' || rawType === 'submission' || rawType === 'payment' || rawType === 'review' || rawType === 'offer') {
    return { type: rawType, text }
  }

  return { type: 'system', text }
}

export default function DealDetailPage() {
  const params = useParams()
  const dealId = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [token, setToken] = useState('')
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'brand' | 'creator'>('creator')
  const [deal, setDeal] = useState<Deal | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  const [briefText, setBriefText] = useState('')
  const [briefAssetUrl, setBriefAssetUrl] = useState('')
  const [assetText, setAssetText] = useState('')
  const [assetUrl, setAssetUrl] = useState('')
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [deliverableTitle, setDeliverableTitle] = useState('')
  const [deliverableNotes, setDeliverableNotes] = useState('')
  const [chatInput, setChatInput] = useState('')
  const chatContainerRef = useRef<HTMLDivElement | null>(null)

  const getHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token])

  const loadMessages = useCallback(async (authToken: string) => {
    const response = await fetch(`/api/deals/${dealId}/messages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    const payload = (await response.json()) as MessagesResponse & { error?: string }
    if (!response.ok) {
      throw new Error(payload.error || 'Could not load messages.')
    }

    setMessages(Array.isArray(payload.messages) ? payload.messages : [])
  }, [dealId])

  const loadDeal = useCallback(async (authToken: string) => {
    const response = await fetch(`/api/deals/${dealId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    const payload = (await response.json()) as Partial<DealResponse> & { error?: string }
    if (!response.ok) {
      throw new Error(payload.error || 'Could not load deal.')
    }

    setRole(payload.role === 'brand' ? 'brand' : 'creator')
    setDeal(payload.deal || null)
    setApplications(Array.isArray(payload.applications) ? payload.applications : [])
  }, [dealId])

  const loadDeliverables = useCallback(async (authToken: string) => {
    const response = await fetch(`/api/deliverables?deal_id=${encodeURIComponent(dealId)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    const payload = (await response.json()) as Partial<DeliverablesResponse> & { error?: string }
    if (!response.ok) {
      throw new Error(payload.error || 'Could not load deliverables.')
    }

    setDeliverables(Array.isArray(payload.deliverables) ? payload.deliverables : [])
  }, [dealId])

  const reload = useCallback(async () => {
    if (!token) return
    await Promise.all([loadDeal(token), loadMessages(token), loadDeliverables(token)])
  }, [loadDeal, loadMessages, loadDeliverables, token])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [{ data: userData }, { data: sessionData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ])

        if (!userData.user || !sessionData.session?.access_token) {
          router.push('/login')
          return
        }

        setUserId(userData.user.id)
        setToken(sessionData.session.access_token)

        await Promise.all([
          loadDeal(sessionData.session.access_token),
          loadMessages(sessionData.session.access_token),
          loadDeliverables(sessionData.session.access_token),
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load deal.')
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [loadDeal, loadDeliverables, loadMessages, router, supabase])

  useEffect(() => {
    if (!dealId || !userId) return

    const channel = supabase
      .channel(`deal-chat:${dealId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `deal_id=eq.${dealId}` },
        async () => {
          if (!token) return
          try {
            await loadMessages(token)
          } catch {
            // ignore transient realtime refresh issues
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dealId, loadMessages, supabase, token, userId])

  useEffect(() => {
    const node = chatContainerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  const transition = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!token) return

    setWorking(true)
    setError('')

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({ action, ...extra }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Could not update deal.')
      }

      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update deal.')
    } finally {
      setWorking(false)
    }
  }

  const sendChat = async (event: FormEvent) => {
    event.preventDefault()
    if (!chatInput.trim() || !token || working) return

    setWorking(true)
    setError('')

    try {
      const response = await fetch(`/api/deals/${dealId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({ content: chatInput.trim() }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Could not send message.')
      }

      setChatInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.')
    } finally {
      setWorking(false)
    }
  }

  const progressIndex = FLOW.indexOf(deal?.status || '')
  const hasSubmittedDeliverables = deliverables.length > 0
  const briefItems = useMemo(
    () => messages.map((m) => ({ ...m, parsed: parseMessageType(m.content) })).filter((m) => m.parsed.type === 'brief'),
    [messages]
  )
  const creatorAssetItems = useMemo(
    () => messages.map((m) => ({ ...m, parsed: parseMessageType(m.content) })).filter((m) => m.parsed.type === 'asset'),
    [messages]
  )
  const chatMessages = useMemo(
    () => messages.map((m) => ({ ...m, parsed: parseMessageType(m.content) })).filter((m) => m.parsed.type === 'chat'),
    [messages]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-[#6b6b6b]">Deal not found.</p>
        <Link href="/deals" className="btn-primary mt-4 inline-block">Back to deals</Link>
      </div>
    )
  }

  const otherPartyName = role === 'brand' ? deal.creators?.display_name : deal.brands?.company_name
  const valueLabel = deal.value != null ? `£${deal.value.toLocaleString()}` : '—'
  const statusAtLeast = (target: DealStatus) => FLOW.indexOf(deal.status) >= FLOW.indexOf(target)

  const submitDeliverable = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !deal || !deal.creator_id || !submissionUrl.trim() || working) return

    setWorking(true)
    setError('')

    try {
      const response = await fetch('/api/deliverables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({
          deal_id: deal.id,
          creator_id: deal.creator_id,
          title: deliverableTitle.trim(),
          drive_link: submissionUrl.trim(),
          notes: deliverableNotes.trim(),
          submitted_at: new Date().toISOString(),
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Could not submit deliverable.')
      }

      setSubmissionUrl('')
      setDeliverableTitle('')
      setDeliverableNotes('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit deliverable.')
    } finally {
      setWorking(false)
    }
  }

  const reviewDeliverable = async (deliverableId: string, nextStatus: 'approved' | 'revision_requested') => {
    if (!token || !deal || working) return

    setWorking(true)
    setError('')

    try {
      const response = await fetch('/api/deliverables', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({
          deal_id: deal.id,
          deliverable_id: deliverableId,
          status: nextStatus,
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Could not review deliverable.')
      }

      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review deliverable.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-4 md:py-8 space-y-5">
      <div>
        <Link href="/deals" className="text-sm text-[#6b6b6b] hover:text-[#1c1c1e]">← Back to deals</Link>
      </div>

      {error && <div className="card border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

      <section className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-bricolage)',
                fontWeight: 600,
                fontSize: 'clamp(26px, 4vw, 40px)',
                letterSpacing: '-1.5px',
                color: '#1c1c1e',
              }}
            >
              {deal.jobs?.title || 'Untitled deal'}
            </h1>
            <p className="text-sm text-[#6b6b6b] mt-2">
              {role === 'brand' ? 'Creator' : 'Brand'}: {otherPartyName || '—'} · Value: {valueLabel}
            </p>
          </div>
          <StatusBadge status={deal.status} />
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4">Status timeline</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[700px] grid grid-cols-9 gap-2">
            {FLOW.map((step, index) => {
              const active = progressIndex >= index
              const current = progressIndex === index
              return (
                <div key={step} className="text-center">
                  <div className={`h-2 rounded-full ${active ? 'bg-[#ccff00]' : 'bg-[#ecece8]'}`} />
                  <p className={`mt-2 text-xs capitalize ${current ? 'text-[#1c1c1e] font-semibold' : 'text-[#8a8a88]'}`}>
                    {statusLabel(step)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {role === 'brand' && (deal.status === 'application_sent' || deal.status === 'under_review') && (
        <section className="card">
          <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4">Review applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-[#6b6b6b]">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-[#ecece8] p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-[#1c1c1e]">{application.creators?.display_name || 'Creator'}</p>
                      <p className="text-xs text-[#8a8a88]">{application.creators?.headline || 'Applicant'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {application.proposed_rate != null && (
                        <span className="text-sm font-semibold text-[#1c1c1e]">£{application.proposed_rate.toLocaleString()}</span>
                      )}
                      <button
                        onClick={() => transition('brand_accept_application', { applicationId: application.id })}
                        disabled={working}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        Accept + extend offer
                      </button>
                    </div>
                  </div>
                  {application.message && <p className="text-sm text-[#6b6b6b] mt-3 whitespace-pre-wrap">{application.message}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {role === 'creator' && deal.status === 'offered' && (
        <section className="card">
          <h2 className="text-lg font-semibold text-[#1c1c1e] mb-2">Offer received</h2>
          <p className="text-sm text-[#6b6b6b] mb-4">You have an offer for this deal. Accept to begin work or decline to archive it.</p>
          <div className="flex gap-2">
            <button onClick={() => transition('creator_offer_response', { response: 'accept' })} className="btn-primary text-sm" disabled={working}>
              Accept offer
            </button>
            <button onClick={() => transition('creator_offer_response', { response: 'decline' })} className="btn-ghost text-sm" disabled={working}>
              Decline
            </button>
          </div>
        </section>
      )}

      {statusAtLeast('accepted') && !['archived', 'declined', 'cancelled'].includes(deal.status) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="text-lg font-semibold text-[#1c1c1e] mb-2">Brief + assets</h2>
            <p className="text-xs text-[#8a8a88] mb-4">Brand uploads brief notes/assets. Creator uploads working assets.</p>

            {role === 'brand' && (
              <form
                onSubmit={async (event) => {
                  event.preventDefault()
                  await transition('add_brief', { text: briefText, assetUrl: briefAssetUrl })
                  setBriefText('')
                  setBriefAssetUrl('')
                }}
                className="space-y-2 mb-4"
              >
                <textarea
                  value={briefText}
                  onChange={(event) => setBriefText(event.target.value)}
                  rows={3}
                  placeholder="Share brief details..."
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <input
                  value={briefAssetUrl}
                  onChange={(event) => setBriefAssetUrl(event.target.value)}
                  placeholder="Optional asset URL"
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <button type="submit" className="btn-primary text-sm" disabled={working}>Upload brief</button>
              </form>
            )}

            {role === 'creator' && (
              <form
                onSubmit={async (event) => {
                  event.preventDefault()
                  await transition('add_creator_asset', { text: assetText, assetUrl })
                  setAssetText('')
                  setAssetUrl('')
                }}
                className="space-y-2 mb-4"
              >
                <textarea
                  value={assetText}
                  onChange={(event) => setAssetText(event.target.value)}
                  rows={3}
                  placeholder="Share progress details..."
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <input
                  value={assetUrl}
                  onChange={(event) => setAssetUrl(event.target.value)}
                  placeholder="Asset URL"
                  className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <button type="submit" className="btn-primary text-sm" disabled={working}>Upload asset</button>
              </form>
            )}

            <div className="space-y-2">
              {briefItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#ecece8] p-3">
                  <p className="text-xs font-semibold text-[#8a8a88]">Brief · {item.sender_name}</p>
                  <p className="text-sm text-[#1c1c1e] whitespace-pre-wrap mt-1">{item.parsed.text}</p>
                </div>
              ))}
              {creatorAssetItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#ecece8] p-3">
                  <p className="text-xs font-semibold text-[#8a8a88]">Creator asset · {item.sender_name}</p>
                  <p className="text-sm text-[#1c1c1e] whitespace-pre-wrap mt-1">{item.parsed.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <h2 className="text-lg font-semibold text-[#1c1c1e]">Deliver work</h2>
                {hasSubmittedDeliverables && (
                  <span className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider">
                    {deliverables.length} submission{deliverables.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6b6b6b] mb-4">Drop in a Google Drive link so the brand can view or download the finished video.</p>

              {role === 'creator' && (deal.status === 'accepted' || deal.status === 'in_progress' || deal.status === 'revision_requested') && (
                <form onSubmit={submitDeliverable} className="space-y-2">
                  <input
                    value={submissionUrl}
                    onChange={(event) => setSubmissionUrl(event.target.value)}
                    placeholder="Google Drive Link"
                    className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                    required
                  />
                  <input
                    value={deliverableTitle}
                    onChange={(event) => setDeliverableTitle(event.target.value)}
                    placeholder="Title / Description"
                    className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  />
                  <textarea
                    value={deliverableNotes}
                    onChange={(event) => setDeliverableNotes(event.target.value)}
                    rows={3}
                    placeholder="Optional notes"
                    className="w-full bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                  />
                  <button type="submit" className="btn-primary text-sm" disabled={working || !submissionUrl.trim()}>
                    Submit Deliverable
                  </button>
                </form>
              )}

              {!hasSubmittedDeliverables ? (
                <div className="rounded-xl border border-dashed border-[#dfe6b2] bg-[#fbfde9] p-4 mt-3 text-sm text-[#6b6b6b]">
                  No videos submitted yet.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {deliverables.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[#ecece8] bg-white p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-[#1c1c1e]">{item.title || 'Video deliverable'}</p>
                          <p className="text-xs text-[#8a8a88] mt-1">Submitted {formatDate(item.submitted_at)}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${deliverableStatusClass(item.status)}`}>
                          {deliverableStatusLabel(item.status)}
                        </span>
                      </div>

                      <a
                        href={item.drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center rounded-xl bg-[#f5f5f1] px-3 py-2 text-sm font-medium text-[#1c1c1e] hover:bg-[#ecece8] break-all"
                      >
                        {item.drive_link}
                      </a>

                      {item.notes && <p className="mt-3 text-sm text-[#6b6b6b] whitespace-pre-wrap">{item.notes}</p>}

                      {role === 'brand' && item.status === 'submitted' && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          <button
                            onClick={() => reviewDeliverable(item.id, 'approved')}
                            className="btn-primary text-sm"
                            disabled={working}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewDeliverable(item.id, 'revision_requested')}
                            className="btn-ghost text-sm"
                            disabled={working}
                          >
                            Request Revision
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-[#1c1c1e] mb-2">Payment</h2>
              <p className="text-sm text-[#6b6b6b] mb-3">Move the deal through payment and completion.</p>

              {role === 'brand' && deal.status === 'reviewed' && (
                <button onClick={() => transition('mark_paid')} className="btn-primary text-sm" disabled={working}>
                  Mark paid
                </button>
              )}

              {role === 'brand' && deal.status === 'paid' && (
                <button onClick={() => transition('mark_complete')} className="btn-primary text-sm" disabled={working}>
                  Mark complete
                </button>
              )}

              {['paid', 'complete'].includes(deal.status) && (
                <p className="text-sm text-emerald-700 font-medium">
                  {deal.status === 'complete' ? 'Deal is complete.' : 'Payment has been marked as sent.'}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4">Deal chat</h2>
        <div ref={chatContainerRef} className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {chatMessages.length === 0 ? (
            <p className="text-sm text-[#6b6b6b]">No chat messages yet.</p>
          ) : (
            chatMessages.map((message) => {
              const own = message.sender_id === userId
              return (
                <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${own ? 'bg-[#ccff00] text-[#1c1c1e]' : 'bg-white border border-[#e8e8e4] text-[#1c1c1e]'}`}>
                    {!own && <p className="text-xs font-semibold text-[#8a8a88] mb-1">{message.sender_name}</p>}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-[11px] mt-1 ${own ? 'text-[#1c1c1e]/60' : 'text-[#8a8a88]'}`}>{formatDate(message.created_at)}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form onSubmit={sendChat} className="mt-4 flex gap-2">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white border border-[#e8e8e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
          />
          <button type="submit" className="btn-primary text-sm" disabled={working || !chatInput.trim()}>
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
