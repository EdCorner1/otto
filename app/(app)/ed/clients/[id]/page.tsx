'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isEdUser } from '@/lib/ed-auth'

const PLATFORMS = ['TikTok', 'Instagram/Reels', 'YouTube', 'Facebook'] as const
const GOAL_PLATFORMS = ['All', ...PLATFORMS] as const

type Platform = (typeof PLATFORMS)[number]
type GoalPlatform = (typeof GOAL_PLATFORMS)[number]
type GoalStatus = 'on_track' | 'behind' | 'not_started' | 'complete'

type CampaignSummary = {
  id: string
  client_id: string
  name: string
  start_date: string
  end_date: string | null
  status: 'active' | 'paused' | 'completed'
  platforms: string[] | null
  notes: string | null
  tiktok_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  facebook_url: string | null
  created_at: string
  goals: Array<{
    id: string
    campaign_id: string
    platform: GoalPlatform
    target_per_month: number
  }>
  total_views: number
  post_count: number
}

type ClientPayload = {
  client: {
    id: string
    name: string
    brand_color: string | null
    logo_url: string | null
  }
  campaigns: CampaignSummary[]
}

type SummaryCampaign = {
  campaign_id: string
  campaign_name: string
  status: 'active' | 'paused' | 'completed'
  start_date: string
  profile_urls: {
    tiktok_url: string | null
    instagram_url: string | null
    youtube_url: string | null
    facebook_url: string | null
  }
  views_month: number
  videos_month: number
  total_views: number
  total_posts: number
  lifetime_posts_by_platform: Array<{ platform: Platform; posts: number }>
  monthly_posts_by_platform: Array<{ platform: Platform; posts: number }>
  lifetime_views_by_platform: Array<{ platform: Platform; views: number }>
  goal_progress_by_platform: Array<{
    platform: GoalPlatform
    target_per_month: number
    actual_posts_month: number
    expected_pace: number
    progress_percent: number
    status: GoalStatus
  }>
  goal_status: 'on_track' | 'behind' | 'not_started'
}

type ClientSummaryPayload = {
  total_views_month: number
  total_videos_month: number
  active_campaigns: number
  campaign_breakdown: SummaryCampaign[]
  platform_breakdown: Array<{ platform: string; views: number }>
}

type CampaignPost = {
  id: string
  campaign_id: string
  video_url: string
  platform: string
  views: number
  likes: number | null
  posted_at: string
}

type CampaignTeamMember = {
  id: string
  campaign_id: string
  user_id: string | null
  name: string
  role: string
}

type CampaignDetail = {
  campaign: {
    id: string
    name: string
    status: 'active' | 'paused' | 'completed'
  }
  posts: CampaignPost[]
  team: CampaignTeamMember[]
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-[#ccff00]/40 text-[#1c1c1e] border-[#d2ef56]',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-zinc-100 text-zinc-700 border-zinc-200',
}

const GOAL_STATUS_CHIP: Record<'on_track' | 'behind' | 'not_started', string> = {
  on_track: 'bg-[#ccff00]/30 text-[#1c1c1e] border-[#ccff00]',
  behind: 'bg-red-100 text-red-700 border-red-300',
  not_started: 'bg-zinc-100 text-zinc-600 border-zinc-300',
}

const GOAL_PROGRESS_BAR: Record<GoalStatus, string> = {
  on_track: '#ccff00',
  complete: '#ccff00',
  behind: '#EF4444',
  not_started: '#9CA3AF',
}

const PLATFORM_LABEL_SHORT: Record<GoalPlatform, string> = {
  All: 'All',
  TikTok: 'TikTok',
  'Instagram/Reels': 'Reels',
  YouTube: 'YouTube',
  Facebook: 'Facebook',
}

function formatDate(dateLike: string | null | undefined) {
  if (!dateLike) return '—'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusLabel(status: GoalStatus) {
  if (status === 'on_track' || status === 'complete') return 'On Track'
  if (status === 'behind') return 'Behind'
  return 'Not Started'
}

function TikTokIcon() {
  return <span className="text-sm font-semibold">TT</span>
}

function InstagramIcon() {
  return <span className="text-sm font-semibold">IG</span>
}

function YouTubeIcon() {
  return <span className="text-sm font-semibold">YT</span>
}

function FacebookIcon() {
  return <span className="text-sm font-semibold">FB</span>
}

export default function EdClientDashboardPage() {
  const params = useParams<{ id: string }>()
  const clientId = params?.id
  const router = useRouter()
  const supabase = createClient()

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<ClientPayload | null>(null)
  const [summary, setSummary] = useState<ClientSummaryPayload | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [campaignDetails, setCampaignDetails] = useState<Record<string, CampaignDetail>>({})
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    status: 'active',
    platforms: ['TikTok'] as string[],
    notes: '',
    tiktok_url: '',
    instagram_url: '',
    youtube_url: '',
    facebook_url: '',
    targets: {
      All: '',
      TikTok: '',
      'Instagram/Reels': '',
      YouTube: '',
      Facebook: '',
    } as Record<GoalPlatform, string>,
  })

  const [editForm, setEditForm] = useState({
    tiktok_url: '',
    instagram_url: '',
    youtube_url: '',
    facebook_url: '',
    targets: {
      All: '',
      TikTok: '',
      'Instagram/Reels': '',
      YouTube: '',
      Facebook: '',
    } as Record<GoalPlatform, string>,
  })

  const [postForm, setPostForm] = useState({
    campaign_id: '',
    video_url: '',
    platform: 'TikTok',
    views: '0',
    likes: '',
    posted_at: '',
  })

  const [teamForm, setTeamForm] = useState({
    campaign_id: '',
    user_id: '',
    name: '',
    role: 'Client',
  })

  const fetchJson = useCallback(async <T,>(url: string): Promise<T> => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const body = (await response.json()) as T & { error?: string }
    if (!response.ok) throw new Error(body.error || 'Request failed')
    return body as T
  }, [token])

  const loadBase = useCallback(async () => {
    if (!clientId || !token) return

    const [clientData, summaryData] = await Promise.all([
      fetchJson<ClientPayload>(`/api/ed/clients/${clientId}`),
      fetchJson<ClientSummaryPayload>(`/api/ed/clients/${clientId}/summary`),
    ])

    setPayload(clientData)
    setSummary(summaryData)

    if (!postForm.campaign_id && clientData.campaigns[0]?.id) {
      setPostForm((prev) => ({ ...prev, campaign_id: clientData.campaigns[0].id }))
    }

    if (!teamForm.campaign_id && clientData.campaigns[0]?.id) {
      setTeamForm((prev) => ({ ...prev, campaign_id: clientData.campaigns[0].id }))
    }
  }, [clientId, fetchJson, postForm.campaign_id, teamForm.campaign_id, token])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user

        if (!user) {
          router.replace(`/login?redirectTo=/ed/clients/${clientId}`)
          return
        }

        if (!isEdUser(user)) {
          router.replace('/dashboard')
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) {
          router.replace(`/login?redirectTo=/ed/clients/${clientId}`)
          return
        }

        if (!cancelled) setToken(accessToken)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not authenticate.')
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [clientId, router, supabase])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!token || !clientId) return
      try {
        setLoading(true)
        await loadBase()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load client dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [clientId, loadBase, token])

  const loadCampaignDetail = useCallback(async (campaignId: string) => {
    if (campaignDetails[campaignId]) return
    const detail = await fetchJson<CampaignDetail>(`/api/ed/campaigns/${campaignId}`)
    setCampaignDetails((prev) => ({ ...prev, [campaignId]: detail }))
  }, [campaignDetails, fetchJson])

  const summaryByCampaignId = useMemo(() => {
    const next = new Map<string, SummaryCampaign>()
    for (const row of summary?.campaign_breakdown || []) next.set(row.campaign_id, row)
    return next
  }, [summary?.campaign_breakdown])

  const toGoalsPayload = (targets: Record<GoalPlatform, string>) => {
    return GOAL_PLATFORMS.map((platform) => ({
      platform,
      target_per_month: Math.max(0, Number(targets[platform] || 0) || 0),
    }))
  }

  const onCampaignSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!clientId || !token) return

    try {
      setSaving(true)
      const response = await fetch('/api/ed/campaigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          name: campaignForm.name,
          start_date: campaignForm.start_date,
          end_date: campaignForm.end_date || null,
          status: campaignForm.status,
          platforms: campaignForm.platforms,
          notes: campaignForm.notes || null,
          tiktok_url: campaignForm.tiktok_url || null,
          instagram_url: campaignForm.instagram_url || null,
          youtube_url: campaignForm.youtube_url || null,
          facebook_url: campaignForm.facebook_url || null,
          goals: toGoalsPayload(campaignForm.targets),
        }),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'Could not create campaign.')

      setCampaignForm({
        name: '',
        start_date: '',
        end_date: '',
        status: 'active',
        platforms: ['TikTok'],
        notes: '',
        tiktok_url: '',
        instagram_url: '',
        youtube_url: '',
        facebook_url: '',
        targets: { All: '', TikTok: '', 'Instagram/Reels': '', YouTube: '', Facebook: '' },
      })
      await loadBase()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create campaign.')
    } finally {
      setSaving(false)
    }
  }

  const openEditCampaign = (campaign: CampaignSummary) => {
    const targetMap: Record<GoalPlatform, string> = { All: '', TikTok: '', 'Instagram/Reels': '', YouTube: '', Facebook: '' }

    for (const goal of campaign.goals || []) {
      if (goal.platform in targetMap) {
        targetMap[goal.platform as GoalPlatform] = String(goal.target_per_month || 0)
      }
    }

    setEditForm({
      tiktok_url: campaign.tiktok_url || '',
      instagram_url: campaign.instagram_url || '',
      youtube_url: campaign.youtube_url || '',
      facebook_url: campaign.facebook_url || '',
      targets: targetMap,
    })

    setEditingCampaignId(campaign.id)
  }

  const onSaveCampaignEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !editingCampaignId) return

    try {
      setSaving(true)
      const response = await fetch(`/api/ed/campaigns/${editingCampaignId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tiktok_url: editForm.tiktok_url || null,
          instagram_url: editForm.instagram_url || null,
          youtube_url: editForm.youtube_url || null,
          facebook_url: editForm.facebook_url || null,
          goals: toGoalsPayload(editForm.targets),
        }),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'Could not update campaign.')

      setEditingCampaignId(null)
      await loadBase()
      setCampaignDetails((prev) => {
        const next = { ...prev }
        delete next[editingCampaignId]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update campaign.')
    } finally {
      setSaving(false)
    }
  }

  const onPostSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !postForm.campaign_id) return

    try {
      setSaving(true)
      const response = await fetch(`/api/ed/campaigns/${postForm.campaign_id}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: postForm.video_url,
          platform: postForm.platform,
          views: Number(postForm.views || 0),
          likes: postForm.likes ? Number(postForm.likes) : null,
          posted_at: postForm.posted_at || null,
        }),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'Could not add post.')

      setPostForm((prev) => ({ ...prev, video_url: '', views: '0', likes: '', posted_at: '' }))
      await loadBase()
      setCampaignDetails((prev) => {
        const next = { ...prev }
        delete next[postForm.campaign_id]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add post.')
    } finally {
      setSaving(false)
    }
  }

  const onTeamSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !teamForm.campaign_id) return

    try {
      setSaving(true)
      const response = await fetch(`/api/ed/campaigns/${teamForm.campaign_id}/team`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: teamForm.user_id || null,
          name: teamForm.name,
          role: teamForm.role,
        }),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error || 'Could not add team member.')

      setTeamForm((prev) => ({ ...prev, user_id: '', name: '', role: 'Client' }))
      await loadBase()
      setCampaignDetails((prev) => {
        const next = { ...prev }
        delete next[teamForm.campaign_id]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add team member.')
    } finally {
      setSaving(false)
    }
  }

  const clientName = payload?.client.name || 'Client'
  const clientAccent = payload?.client.brand_color || '#ccff00'
  const platformRows = useMemo(() => summary?.platform_breakdown || [], [summary?.platform_breakdown])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 pb-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="section-label mb-1">Client dashboard</p>
            <h1 className="text-4xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{clientName}</h1>
          </div>
          <Link href="/ed" className="btn-ghost text-sm px-4 py-2">← Back to overview</Link>
        </div>
        <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: clientAccent }} />
      </div>

      {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card"><p className="text-xs text-[#9a9a9a]">Total views MTD</p><p className="mt-2 text-3xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>{(summary?.total_views_month || 0).toLocaleString()}</p></div>
        <div className="card"><p className="text-xs text-[#9a9a9a]">Videos MTD</p><p className="mt-2 text-3xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>{(summary?.total_videos_month || 0).toLocaleString()}</p></div>
        <div className="card"><p className="text-xs text-[#9a9a9a]">Active campaigns</p><p className="mt-2 text-3xl font-semibold" style={{ fontFamily: 'var(--font-bricolage)' }}>{(summary?.active_campaigns || 0).toLocaleString()}</p></div>
      </section>

      <section className="card mb-6">
        <p className="section-label mb-2">Platform breakdown</p>
        {platformRows.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No platform data yet this month.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {platformRows.map((row) => (
              <div key={row.platform} className="rounded-xl border border-[#efefea] bg-[#fafaf9] p-4">
                <p className="text-sm text-[#6b6b6b]">{row.platform}</p>
                <p className="text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>{row.views.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Campaigns</h2>
        </div>

        {(payload?.campaigns || []).length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No campaigns yet. Add your first campaign below.</p>
        ) : (
          <div className="space-y-3">
            {payload?.campaigns.map((campaign) => {
              const isOpen = expandedId === campaign.id
              const detail = campaignDetails[campaign.id]
              const campaignSummary = summaryByCampaignId.get(campaign.id)
              const goalRows = campaignSummary?.goal_progress_by_platform || []
              const lifetimeTotal = campaignSummary?.total_posts || 0

              return (
                <div key={campaign.id} className="rounded-2xl border border-[#ecece8] bg-[#fafaf9]">
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#1c1c1e]">{campaign.name}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">{formatDate(campaign.start_date)} — {formatDate(campaign.end_date)} · {campaign.total_views.toLocaleString()} views · {campaign.post_count} posts</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[campaign.status] || STATUS_BADGE.completed}`}>
                          {campaign.status}
                        </span>
                        <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={() => openEditCampaign(campaign)}>Edit Campaign</button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {campaignSummary?.profile_urls?.tiktok_url ? <a href={campaignSummary.profile_urls.tiktok_url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e8e4] bg-white text-[#1c1c1e]"><TikTokIcon /></a> : null}
                      {campaignSummary?.profile_urls?.instagram_url ? <a href={campaignSummary.profile_urls.instagram_url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e8e4] bg-white text-[#1c1c1e]"><InstagramIcon /></a> : null}
                      {campaignSummary?.profile_urls?.youtube_url ? <a href={campaignSummary.profile_urls.youtube_url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e8e4] bg-white text-[#1c1c1e]"><YouTubeIcon /></a> : null}
                      {campaignSummary?.profile_urls?.facebook_url ? <a href={campaignSummary.profile_urls.facebook_url} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e8e4] bg-white text-[#1c1c1e]"><FacebookIcon /></a> : null}
                    </div>

                    <div className="mt-4 rounded-xl border border-[#ecece8] bg-white p-3">
                      <p className="text-xs text-[#6b6b6b]">{lifetimeTotal} of lifetime videos since {formatDate(campaignSummary?.start_date || campaign.start_date)}</p>
                      <p className="text-xs text-[#6b6b6b] mt-1">Monthly: {(campaignSummary?.videos_month || 0).toLocaleString()} videos this month</p>

                      <div className="mt-3 space-y-2">
                        {goalRows.length === 0 ? (
                          <p className="text-xs text-[#6b6b6b]">No goal targets set yet.</p>
                        ) : (
                          goalRows.map((goal) => (
                            <div key={goal.platform} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <p className="text-[#1c1c1e] font-medium">{PLATFORM_LABEL_SHORT[goal.platform]}: {goal.actual_posts_month} of {goal.target_per_month} posts this month ({goal.progress_percent}%)</p>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${GOAL_STATUS_CHIP[goal.status === 'complete' ? 'on_track' : goal.status === 'behind' ? 'behind' : goal.status === 'not_started' ? 'not_started' : 'on_track']}`}>{statusLabel(goal.status)}</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-[#ecece8]">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, goal.progress_percent)}%`, backgroundColor: GOAL_PROGRESS_BAR[goal.status] }} />
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#6b6b6b]">
                        <div>
                          <p className="mb-1 font-medium text-[#1c1c1e]">Lifetime posts by platform</p>
                          {(campaignSummary?.lifetime_posts_by_platform || []).map((row) => (
                            <p key={`posts-${row.platform}`}>{row.platform}: {row.posts}</p>
                          ))}
                        </div>
                        <div>
                          <p className="mb-1 font-medium text-[#1c1c1e]">Lifetime views by platform</p>
                          {(campaignSummary?.lifetime_views_by_platform || []).map((row) => (
                            <p key={`views-${row.platform}`}>{row.platform}: {row.views.toLocaleString()}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-3 text-xs font-medium text-[#1c1c1e] underline decoration-[#ccff00]"
                      onClick={async () => {
                        const next = isOpen ? null : campaign.id
                        setExpandedId(next)
                        if (next) await loadCampaignDetail(next)
                      }}
                    >
                      {isOpen ? 'Hide details' : 'Show posts & team'}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#ecece8] px-4 py-4 space-y-5">
                      <div>
                        <p className="text-xs text-[#9a9a9a] mb-2">Posts</p>
                        {!detail?.posts.length ? (
                          <p className="text-sm text-[#6b6b6b]">No posts yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {detail.posts.map((post) => (
                              <div key={post.id} className="rounded-xl border border-[#efefea] bg-white px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <a href={post.video_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#1c1c1e] underline decoration-[#ccff00]">View post</a>
                                  <span className="text-xs text-[#6b6b6b]">{post.platform}</span>
                                </div>
                                <p className="text-xs text-[#6b6b6b] mt-1">{post.views.toLocaleString()} views · {(post.likes || 0).toLocaleString()} likes · {formatDate(post.posted_at)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-[#9a9a9a] mb-2">Team</p>
                        {!detail?.team.length ? (
                          <p className="text-sm text-[#6b6b6b]">No team members yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {detail.team.map((member) => (
                              <span key={member.id} className="inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white px-3 py-1.5 text-xs text-[#1c1c1e]">
                                {member.name}
                                <span className="text-[#6b6b6b]">({member.role})</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={onCampaignSubmit} className="card space-y-3">
          <p className="section-label">Add Campaign</p>
          <input value={campaignForm.name} onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Campaign name" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={campaignForm.start_date} onChange={(e) => setCampaignForm((prev) => ({ ...prev, start_date: e.target.value }))} required type="date" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={campaignForm.end_date} onChange={(e) => setCampaignForm((prev) => ({ ...prev, end_date: e.target.value }))} type="date" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <select value={campaignForm.status} onChange={(e) => setCampaignForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm">
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
          </select>
          <div className="flex flex-wrap gap-2 text-xs">
            {PLATFORMS.map((platform) => {
              const active = campaignForm.platforms.includes(platform)
              return (
                <button
                  key={platform}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 ${active ? 'bg-[#ccff00]/30 border-[#d6ef79] text-[#1c1c1e]' : 'bg-white border-[#e8e8e4] text-[#6b6b6b]'}`}
                  onClick={() => {
                    setCampaignForm((prev) => {
                      const next = prev.platforms.includes(platform)
                        ? prev.platforms.filter((value) => value !== platform)
                        : [...prev.platforms, platform]
                      return { ...prev, platforms: next }
                    })
                  }}
                >
                  {platform}
                </button>
              )
            })}
          </div>
          <input value={campaignForm.tiktok_url} onChange={(e) => setCampaignForm((prev) => ({ ...prev, tiktok_url: e.target.value }))} placeholder="TikTok profile URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={campaignForm.instagram_url} onChange={(e) => setCampaignForm((prev) => ({ ...prev, instagram_url: e.target.value }))} placeholder="Instagram/Reels profile URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={campaignForm.youtube_url} onChange={(e) => setCampaignForm((prev) => ({ ...prev, youtube_url: e.target.value }))} placeholder="YouTube channel URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={campaignForm.facebook_url} onChange={(e) => setCampaignForm((prev) => ({ ...prev, facebook_url: e.target.value }))} placeholder="Facebook page URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <div className="rounded-xl border border-[#ecece8] p-3 bg-white space-y-2">
            <p className="text-xs font-medium text-[#1c1c1e]">Monthly post targets</p>
            {GOAL_PLATFORMS.map((platform) => (
              <div key={platform} className="flex items-center justify-between gap-2">
                <label className="text-xs text-[#6b6b6b]">{platform}</label>
                <input
                  type="number"
                  min={0}
                  value={campaignForm.targets[platform]}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, targets: { ...prev.targets, [platform]: e.target.value } }))}
                  className="w-24 rounded-lg border border-[#e8e8e4] px-2 py-1 text-xs"
                />
              </div>
            ))}
          </div>
          <textarea value={campaignForm.notes} onChange={(e) => setCampaignForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm min-h-[80px]" />
          <button disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-60">{saving ? 'Saving...' : 'Add Campaign'}</button>
        </form>

        <form onSubmit={onPostSubmit} className="card space-y-3">
          <p className="section-label">Add Post</p>
          <select value={postForm.campaign_id} onChange={(e) => setPostForm((prev) => ({ ...prev, campaign_id: e.target.value }))} required className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm">
            <option value="">Select campaign</option>
            {(payload?.campaigns || []).map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
          <input value={postForm.video_url} onChange={(e) => setPostForm((prev) => ({ ...prev, video_url: e.target.value }))} required placeholder="Video URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <select value={postForm.platform} onChange={(e) => setPostForm((prev) => ({ ...prev, platform: e.target.value }))} className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm">
            {PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
          </select>
          <input value={postForm.views} onChange={(e) => setPostForm((prev) => ({ ...prev, views: e.target.value }))} required type="number" min={0} placeholder="Views" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={postForm.likes} onChange={(e) => setPostForm((prev) => ({ ...prev, likes: e.target.value }))} type="number" min={0} placeholder="Likes (optional)" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={postForm.posted_at} onChange={(e) => setPostForm((prev) => ({ ...prev, posted_at: e.target.value }))} type="datetime-local" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <button disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-60">{saving ? 'Saving...' : 'Add Post'}</button>
        </form>

        <form onSubmit={onTeamSubmit} className="card space-y-3">
          <p className="section-label">Add Team Member</p>
          <select value={teamForm.campaign_id} onChange={(e) => setTeamForm((prev) => ({ ...prev, campaign_id: e.target.value }))} required className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm">
            <option value="">Select campaign</option>
            {(payload?.campaigns || []).map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
          <input value={teamForm.name} onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))} required placeholder="Name" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={teamForm.role} onChange={(e) => setTeamForm((prev) => ({ ...prev, role: e.target.value }))} required placeholder="Role (Client, Editor...)" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <input value={teamForm.user_id} onChange={(e) => setTeamForm((prev) => ({ ...prev, user_id: e.target.value }))} placeholder="User ID (optional)" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
          <button disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-60">{saving ? 'Saving...' : 'Add Team Member'}</button>
        </form>
      </section>

      {editingCampaignId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={onSaveCampaignEdit} className="w-full max-w-lg rounded-2xl border border-[#ecece8] bg-[#fafaf9] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1c1c1e]" style={{ fontFamily: 'var(--font-bricolage)' }}>Edit Campaign</h3>
              <button type="button" className="text-sm text-[#6b6b6b]" onClick={() => setEditingCampaignId(null)}>Close</button>
            </div>
            <input value={editForm.tiktok_url} onChange={(e) => setEditForm((prev) => ({ ...prev, tiktok_url: e.target.value }))} placeholder="TikTok profile URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
            <input value={editForm.instagram_url} onChange={(e) => setEditForm((prev) => ({ ...prev, instagram_url: e.target.value }))} placeholder="Instagram/Reels profile URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
            <input value={editForm.youtube_url} onChange={(e) => setEditForm((prev) => ({ ...prev, youtube_url: e.target.value }))} placeholder="YouTube channel URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
            <input value={editForm.facebook_url} onChange={(e) => setEditForm((prev) => ({ ...prev, facebook_url: e.target.value }))} placeholder="Facebook page URL" className="w-full rounded-xl border border-[#e8e8e4] bg-white px-3 py-2 text-sm" />
            <div className="rounded-xl border border-[#ecece8] p-3 bg-white space-y-2">
              <p className="text-xs font-medium text-[#1c1c1e]">Monthly post targets per platform</p>
              {GOAL_PLATFORMS.map((platform) => (
                <div key={platform} className="flex items-center justify-between gap-2">
                  <label className="text-xs text-[#6b6b6b]">{platform}</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.targets[platform]}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, targets: { ...prev.targets, [platform]: e.target.value } }))}
                    className="w-24 rounded-lg border border-[#e8e8e4] px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost text-sm px-4 py-2" onClick={() => setEditingCampaignId(null)}>Cancel</button>
              <button disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-60">{saving ? 'Saving...' : 'Save Campaign'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
