import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type AdminClient = SupabaseClient

type CreatorTagRow = { tag: string | null }
type CreatorSocialRow = { platform: string | null; url: string | null }
type PortfolioRow = {
  id: string
  url: string
  type: string | null
  platform: string | null
  caption: string | null
  thumbnail_url: string | null
  created_at: string
  sort_order: number | null
  views_count: number | null
}
type CreatorRow = {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  availability: string | null
  creator_socials?: CreatorSocialRow[] | null
  creator_tags?: CreatorTagRow[] | null
  portfolio_items?: PortfolioRow[] | null
}
type JobRelation = { deadline: string | null; timeline: string | null } | Array<{ deadline: string | null; timeline: string | null }> | null

type DealRow = {
  id: string
  job_id: string | null
  status: string | null
  created_at: string
  jobs?: JobRelation
}

type MessageRow = {
  deal_id: string
  sender_id: string | null
  created_at: string
}

type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested'

type DeliverableRow = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes: string | null
  status: DeliverableStatus
  created_at: string
}

type Deliverable = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes: string | null
  status: DeliverableStatus
  submitted_at: string
  created_at: string
}

type DeliverableEventPayload = {
  id: string
  deal_id: string
  creator_id: string
  title: string
  drive_link: string
  notes: string | null
  status: DeliverableStatus
  submitted_at: string
}

type DeliverableReviewPayload = {
  deliverable_id: string
  status: DeliverableStatus
  reviewed_at: string
}

export type PublicPortfolioVideo = {
  id: string
  url: string
  caption: string | null
  platform: string
  createdAt: string
  thumbnailUrl: string | null
  viewCount: number
  kind: 'youtube' | 'direct' | 'mux'
  youtubeId: string | null
  playbackId: string | null
}

export type PublicPortfolioSocial = {
  platform: string
  label: string
  url: string
}

export type PublicCreatorPortfolio = {
  id: string
  userId: string
  fullName: string
  handle: string
  bio: string
  avatarUrl: string | null
  location: string | null
  availability: string | null
  isAvailable: boolean
  mainPlatform: string
  nicheTags: string[]
  socials: PublicPortfolioSocial[]
  portfolioItems: PublicPortfolioVideo[]
  stats: {
    completedCampaigns: number
    totalVideos: number
    avgViews: number
    responseTimeHours: number | null
    videosDelivered: number
    onTimePercentage: number | null
  }
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function createAdminClient() {
  return createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

function normalizePlatform(value: string | null | undefined) {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'youtube shorts') return 'youtube'
  return normalized
}

function labelPlatform(platform: string) {
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'website') return 'Website'
  return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Link'
}

function parseCreatorMeta(tags: CreatorTagRow[] | null | undefined) {
  const safeTags = (tags || []).map((entry) => entry.tag || '').filter(Boolean)

  const readSingle = (prefix: string) => {
    const match = safeTags.find((tag) => tag.toLowerCase().startsWith(prefix))
    return match ? match.slice(prefix.length).trim() : ''
  }

  const readMulti = (prefix: string) =>
    safeTags
      .filter((tag) => tag.toLowerCase().startsWith(prefix))
      .map((tag) => tag.slice(prefix.length).trim())
      .filter(Boolean)

  return {
    handle: normalizeHandle(readSingle('handle:')),
    mainPlatform: normalizePlatform(readSingle('main_platform:')),
    nicheTags: Array.from(new Set(readMulti('niche:'))),
  }
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

function extractYouTubeId(url: string) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function inferPortfolioKind(url: string, platform: string, type: string | null) {
  const youtubeId = extractYouTubeId(url)
  if (platform === 'youtube' || youtubeId) {
    return { kind: 'youtube' as const, youtubeId, playbackId: null }
  }

  if (url && !url.includes('/') && !url.startsWith('http')) {
    return { kind: 'mux' as const, youtubeId: null, playbackId: url }
  }

  return { kind: 'direct' as const, youtubeId: null, playbackId: type === 'video' ? url : null }
}

function sortPortfolio(items: PortfolioRow[] | null | undefined) {
  return [...(items || [])].sort((a, b) => {
    const sortA = a.sort_order ?? 9999
    const sortB = b.sort_order ?? 9999
    if (sortA !== sortB) return sortA - sortB
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function buildPortfolioItems(items: PortfolioRow[] | null | undefined) {
  return sortPortfolio(items)
    .slice(0, 6)
    .map((item) => {
      const platform = normalizePlatform(item.platform) || (extractYouTubeId(item.url) ? 'youtube' : 'portfolio')
      const kind = inferPortfolioKind(item.url, platform, item.type)
      return {
        id: item.id,
        url: item.url,
        caption: item.caption,
        platform,
        createdAt: item.created_at,
        thumbnailUrl: item.thumbnail_url || (kind.youtubeId ? `https://img.youtube.com/vi/${kind.youtubeId}/hqdefault.jpg` : null),
        viewCount: Math.max(0, Number(item.views_count || 0) || 0),
        kind: kind.kind,
        youtubeId: kind.youtubeId,
        playbackId: kind.playbackId,
      }
    })
}

function buildSocials(rows: CreatorSocialRow[] | null | undefined) {
  const order = ['tiktok', 'instagram', 'youtube', 'website']

  return [...(rows || [])]
    .map((row) => ({
      platform: normalizePlatform(row.platform),
      url: String(row.url || '').trim(),
    }))
    .filter((row) => row.platform && row.url)
    .sort((a, b) => {
      const aIndex = order.indexOf(a.platform)
      const bIndex = order.indexOf(b.platform)
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
    })
    .map((row) => ({
      ...row,
      label: labelPlatform(row.platform),
    }))
}

function isSettledDealStatus(status: string | null | undefined) {
  return status === 'paid' || status === 'complete'
}

function average(values: number[]) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function computeAverageResponseHours(messages: MessageRow[], creatorUserId: string) {
  const grouped = new Map<string, MessageRow[]>()

  for (const message of messages) {
    const existing = grouped.get(message.deal_id) || []
    existing.push(message)
    grouped.set(message.deal_id, existing)
  }

  const diffs: number[] = []

  for (const group of grouped.values()) {
    const sorted = [...group].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    let latestBrandMessageAt: string | null = null

    for (const message of sorted) {
      if (!message.sender_id) continue

      if (message.sender_id === creatorUserId) {
        if (latestBrandMessageAt) {
          const diffHours = (new Date(message.created_at).getTime() - new Date(latestBrandMessageAt).getTime()) / (1000 * 60 * 60)
          if (Number.isFinite(diffHours) && diffHours >= 0) {
            diffs.push(diffHours)
          }
          latestBrandMessageAt = null
        }
        continue
      }

      latestBrandMessageAt = message.created_at
    }
  }

  const avg = average(diffs)
  return avg === null ? null : Math.max(1, Math.round(avg))
}

function parseSystemEvent<T>(content: string, type: string): T | null {
  const match = content.match(/^\[SYSTEM:([^\]]+)\]\s*/)
  if (!match || match[1]?.trim() !== type) return null

  const raw = content.replace(/^\[SYSTEM:[^\]]+\]\s*/, '').trim()
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function isDeliverableStatus(value: string): value is DeliverableStatus {
  return value === 'submitted' || value === 'approved' || value === 'revision_requested'
}

function normalizeTableDeliverable(row: DeliverableRow): Deliverable {
  return {
    id: row.id,
    deal_id: row.deal_id,
    creator_id: row.creator_id,
    title: row.title,
    drive_link: row.drive_link,
    notes: row.notes,
    status: row.status,
    submitted_at: row.created_at,
    created_at: row.created_at,
  }
}

function deriveDeliverablesFromMessages(messages: Array<{ id: string; content: string; created_at: string }>) {
  const deliverables = new Map<string, Deliverable>()

  for (const message of messages) {
    const submission = parseSystemEvent<DeliverableEventPayload>(message.content, 'deliverable')
    if (submission && isDeliverableStatus(submission.status)) {
      deliverables.set(submission.id, {
        id: submission.id,
        deal_id: submission.deal_id,
        creator_id: submission.creator_id,
        title: submission.title,
        drive_link: submission.drive_link,
        notes: submission.notes ?? null,
        status: submission.status,
        submitted_at: submission.submitted_at || message.created_at,
        created_at: message.created_at,
      })
      continue
    }

    const review = parseSystemEvent<DeliverableReviewPayload>(message.content, 'deliverable_review')
    if (review && isDeliverableStatus(review.status)) {
      const existing = deliverables.get(review.deliverable_id)
      if (existing) {
        deliverables.set(review.deliverable_id, {
          ...existing,
          status: review.status,
        })
      }
    }
  }

  return [...deliverables.values()].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
}

async function hasDeliverablesTable(admin: AdminClient) {
  const { error } = await admin.from('deliverables').select('id').limit(1)
  if (!error) return true
  if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message)) return false
  throw new Error(error.message)
}

async function fetchDeliverables(admin: AdminClient, dealIds: string[]) {
  if (!dealIds.length) return [] as Deliverable[]

  if (await hasDeliverablesTable(admin)) {
    const { data, error } = await admin
      .from('deliverables')
      .select('id, deal_id, creator_id, title, drive_link, notes, status, created_at')
      .in('deal_id', dealIds)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return ((data || []) as DeliverableRow[]).map(normalizeTableDeliverable)
  }

  const { data, error } = await admin
    .from('messages')
    .select('id, content, created_at')
    .in('deal_id', dealIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return deriveDeliverablesFromMessages(data || [])
}

function computeOnTimePercentage(deliverables: Deliverable[], deals: DealRow[]) {
  if (!deliverables.length) return null

  const deadlineByDealId = new Map<string, Date>()
  for (const deal of deals) {
    const job = relationOne(deal.jobs)
    if (!job?.deadline) continue
    const deadline = new Date(job.deadline)
    if (!Number.isNaN(deadline.getTime())) {
      deadlineByDealId.set(deal.id, deadline)
    }
  }

  const comparable = deliverables.filter((deliverable) => deadlineByDealId.has(deliverable.deal_id))
  if (!comparable.length) return null

  const onTime = comparable.filter((deliverable) => {
    const deadline = deadlineByDealId.get(deliverable.deal_id)
    if (!deadline) return false
    return new Date(deliverable.submitted_at).getTime() <= deadline.getTime()
  }).length

  return Math.round((onTime / comparable.length) * 100)
}

export async function getPublicCreatorPortfolioByHandle(handle: string): Promise<PublicCreatorPortfolio | null> {
  const normalizedHandle = normalizeHandle(handle)
  if (!normalizedHandle) return null

  const admin = createAdminClient()

  const { data: tagRow, error: tagError } = await admin
    .from('creator_tags')
    .select('creator_id')
    .ilike('tag', `handle:${normalizedHandle}`)
    .limit(1)
    .maybeSingle()

  if (tagError || !tagRow?.creator_id) {
    return null
  }

  const { data: creator, error: creatorError } = await admin
    .from('creators')
    .select('id, user_id, display_name, bio, avatar_url, location, availability, creator_socials(platform, url), creator_tags(tag), portfolio_items(id, url, type, platform, caption, thumbnail_url, created_at, sort_order, views_count)')
    .eq('id', tagRow.creator_id)
    .single()

  if (creatorError || !creator) {
    return null
  }

  const typedCreator = creator as CreatorRow
  const meta = parseCreatorMeta(typedCreator.creator_tags)
  const portfolioItems = buildPortfolioItems(typedCreator.portfolio_items)
  const socials = buildSocials(typedCreator.creator_socials)

  const { data: dealsData, error: dealsError } = await admin
    .from('deals')
    .select('id, job_id, status, created_at, jobs(deadline, timeline)')
    .eq('creator_id', typedCreator.id)
    .order('created_at', { ascending: false })

  if (dealsError) {
    throw new Error(dealsError.message)
  }

  const deals = (dealsData || []) as DealRow[]
  const dealIds = deals.map((deal) => deal.id)

  let responseTimeHours: number | null = null
  if (dealIds.length) {
    const { data: messageData, error: messageError } = await admin
      .from('messages')
      .select('deal_id, sender_id, created_at')
      .in('deal_id', dealIds)
      .order('created_at', { ascending: true })

    if (messageError) {
      throw new Error(messageError.message)
    }

    responseTimeHours = computeAverageResponseHours((messageData || []) as MessageRow[], typedCreator.user_id)
  }

  const deliverables = dealIds.length ? await fetchDeliverables(admin, dealIds) : []

  const totalViews = portfolioItems.reduce((sum, item) => sum + item.viewCount, 0)
  const viewableItems = portfolioItems.filter((item) => item.viewCount > 0).length
  const avgViews = viewableItems > 0 ? Math.round(totalViews / viewableItems) : 0
  const completedCampaigns = deals.filter((deal) => isSettledDealStatus(deal.status)).length
  const videosDelivered = deliverables.length > 0 ? deliverables.length : portfolioItems.length
  const onTimePercentage = computeOnTimePercentage(deliverables, deals)

  return {
    id: typedCreator.id,
    userId: typedCreator.user_id,
    fullName: typedCreator.display_name || 'Creator',
    handle: meta.handle || normalizedHandle,
    bio: typedCreator.bio || '',
    avatarUrl: typedCreator.avatar_url || null,
    location: typedCreator.location || null,
    availability: typedCreator.availability || null,
    isAvailable: ['open', 'available', 'yes'].includes((typedCreator.availability || '').toLowerCase()),
    mainPlatform: meta.mainPlatform || socials[0]?.platform || 'tiktok',
    nicheTags: meta.nicheTags,
    socials,
    portfolioItems,
    stats: {
      completedCampaigns,
      totalVideos: portfolioItems.length,
      avgViews,
      responseTimeHours,
      videosDelivered,
      onTimePercentage,
    },
  }
}
