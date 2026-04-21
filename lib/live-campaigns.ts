export const LIVE_CAMPAIGN_PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'LinkedIn'] as const
export const LIVE_CAMPAIGN_LOG_STATUSES = ['drafted', 'posted', 'sent_for_approval', 'approved'] as const
export const LIVE_CAMPAIGN_APPROVAL_STATUSES = ['sent_for_approval', 'approved', 'revision_requested'] as const

export type LiveCampaignPlatform = (typeof LIVE_CAMPAIGN_PLATFORMS)[number]
export type LiveCampaignTaskStatus = 'todo' | 'done'
export type LiveCampaignLogStatus = (typeof LIVE_CAMPAIGN_LOG_STATUSES)[number]
export type LiveCampaignApprovalStatus = (typeof LIVE_CAMPAIGN_APPROVAL_STATUSES)[number]

export type LiveCampaignLogNotes = {
  hook: string
  concept: string
  context: string
}

export type LiveCampaignLog = {
  id: string
  platform: LiveCampaignPlatform
  video_url: string
  views: number
  date: string
  created_at: string
  status: LiveCampaignLogStatus
  notes: LiveCampaignLogNotes
}

export type LiveCampaignTask = {
  id: string
  title: string
  detail: string
  due_date: string | null
  status: LiveCampaignTaskStatus
  created_at: string
  completed_at: string | null
}

export type LiveCampaignClientFeedbackEntry = {
  id: string
  body: string
  source: string
  date: string
  created_at: string
}

export type LiveCampaignApprovalEntry = {
  id: string
  title: string
  status: LiveCampaignApprovalStatus
  detail: string
  date: string
  created_at: string
}

export type LiveCampaignMetadata = {
  kind: 'live_campaign'
  version: 1 | 2 | 3
  seed_key: string
  client_name: string
  start_date: string
  contract_days: number
  monthly_rate: number
  daily_target: number
  platforms: LiveCampaignPlatform[]
  logs: LiveCampaignLog[]
  internal_notes: string
  notes_updated_at: string | null
  tasks: LiveCampaignTask[]
  client_feedback: LiveCampaignClientFeedbackEntry[]
  approvals: LiveCampaignApprovalEntry[]
}

export type LiveCampaignSeed = {
  clientName: string
  seedKey: string
  startDate: string
  contractDays: number
  monthlyRate: number
  dailyTarget: number
  platforms: LiveCampaignPlatform[]
  website: string
  industry: string
}

export type LiveCampaignStatus = 'on_track' | 'behind' | 'not_started'

export type LiveCampaignStats = {
  daysActive: number
  videosToday: number
  videosThisWeek: number
  videosThisMonth: number
  viewsThisMonth: number
  totalVideos: number
  totalViews: number
  earnedProrated: number
  monthlyTargetToDate: number
  progressPercent: number
  status: LiveCampaignStatus
}

export const ED_LIVE_CAMPAIGN_SEEDS: LiveCampaignSeed[] = [
  {
    clientName: 'Detris',
    seedKey: 'ed-live-campaign-detris',
    startDate: '2026-04-06',
    contractDays: 30,
    monthlyRate: 1200,
    dailyTarget: 4,
    platforms: [...LIVE_CAMPAIGN_PLATFORMS],
    website: 'https://detris.ai',
    industry: 'Technology',
  },
  {
    clientName: 'Clawbite',
    seedKey: 'ed-live-campaign-clawbite',
    startDate: '2026-04-06',
    contractDays: 30,
    monthlyRate: 1200,
    dailyTarget: 4,
    platforms: [...LIVE_CAMPAIGN_PLATFORMS],
    website: 'https://clawbite.com',
    industry: 'Technology',
  },
]

function toUtcDateOnly(input: string | Date) {
  const source = input instanceof Date ? input : new Date(`${input}T12:00:00Z`)
  return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()))
}

export function startOfToday(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function dateKey(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input)
  return date.toISOString().slice(0, 10)
}

export function normalizePlatform(input: unknown): LiveCampaignPlatform | null {
  if (typeof input !== 'string') return null
  const value = input.trim().toLowerCase()

  if (value === 'tiktok') return 'TikTok'
  if (value === 'instagram' || value === 'instagram/reels' || value === 'reels') return 'Instagram'
  if (value === 'youtube') return 'YouTube'
  if (value === 'linkedin') return 'LinkedIn'

  return null
}

export function normalizeTaskStatus(input: unknown): LiveCampaignTaskStatus {
  return input === 'done' ? 'done' : 'todo'
}

export function normalizeLogStatus(input: unknown): LiveCampaignLogStatus {
  if (input === 'drafted' || input === 'sent_for_approval' || input === 'approved') return input
  return 'posted'
}

export function normalizeApprovalStatus(input: unknown): LiveCampaignApprovalStatus {
  if (input === 'approved' || input === 'revision_requested') return input
  return 'sent_for_approval'
}

function parseTask(input: unknown): LiveCampaignTask | null {
  if (!input || typeof input !== 'object') return null

  const task = input as Partial<LiveCampaignTask>
  const title = typeof task.title === 'string' ? task.title.trim() : ''
  if (!title) return null

  const status = normalizeTaskStatus(task.status)
  const createdAt = typeof task.created_at === 'string' && task.created_at ? task.created_at : new Date().toISOString()
  const completedAt = status === 'done'
    ? typeof task.completed_at === 'string' && task.completed_at ? task.completed_at : new Date().toISOString()
    : null

  return {
    id: typeof task.id === 'string' && task.id ? task.id : crypto.randomUUID(),
    title,
    detail: typeof task.detail === 'string' ? task.detail.trim() : '',
    due_date: typeof task.due_date === 'string' && task.due_date ? task.due_date : null,
    status,
    created_at: createdAt,
    completed_at: completedAt,
  }
}

function parseLog(input: unknown): LiveCampaignLog | null {
  if (!input || typeof input !== 'object') return null

  const log = input as Partial<LiveCampaignLog> & {
    hook?: string
    concept?: string
    context?: string
  }
  const platform = normalizePlatform(log.platform)
  const date = typeof log.date === 'string' && log.date ? log.date : dateKey(new Date())
  const videoUrl = typeof log.video_url === 'string' ? log.video_url.trim() : ''
  const notes = log.notes && typeof log.notes === 'object'
    ? {
      hook: typeof log.notes.hook === 'string' ? log.notes.hook.trim() : '',
      concept: typeof log.notes.concept === 'string' ? log.notes.concept.trim() : '',
      context: typeof log.notes.context === 'string' ? log.notes.context.trim() : '',
    }
    : {
      hook: typeof log.hook === 'string' ? log.hook.trim() : '',
      concept: typeof log.concept === 'string' ? log.concept.trim() : '',
      context: typeof log.context === 'string' ? log.context.trim() : '',
    }

  const hasMeaningfulContent = Boolean(videoUrl || notes.hook || notes.concept || notes.context)
  if (!platform || !hasMeaningfulContent) return null

  return {
    id: typeof log.id === 'string' && log.id ? log.id : `${platform}-${videoUrl || notes.hook || notes.concept || date}-${date}`,
    platform,
    video_url: videoUrl,
    views: Number.isFinite(Number(log.views)) ? Number(log.views) : 0,
    date,
    created_at: typeof log.created_at === 'string' && log.created_at ? log.created_at : new Date(`${date}T12:00:00Z`).toISOString(),
    status: normalizeLogStatus(log.status),
    notes,
  }
}

function parseFeedbackEntry(input: unknown): LiveCampaignClientFeedbackEntry | null {
  if (!input || typeof input !== 'object') return null

  const entry = input as Partial<LiveCampaignClientFeedbackEntry>
  const body = typeof entry.body === 'string' ? entry.body.trim() : ''
  if (!body) return null

  const date = typeof entry.date === 'string' && entry.date ? entry.date : dateKey(new Date())

  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : crypto.randomUUID(),
    body,
    source: typeof entry.source === 'string' ? entry.source.trim() : '',
    date,
    created_at: typeof entry.created_at === 'string' && entry.created_at ? entry.created_at : new Date(`${date}T12:00:00Z`).toISOString(),
  }
}

function parseApprovalEntry(input: unknown): LiveCampaignApprovalEntry | null {
  if (!input || typeof input !== 'object') return null

  const entry = input as Partial<LiveCampaignApprovalEntry>
  const title = typeof entry.title === 'string' ? entry.title.trim() : ''
  if (!title) return null

  const date = typeof entry.date === 'string' && entry.date ? entry.date : dateKey(new Date())

  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : crypto.randomUUID(),
    title,
    status: normalizeApprovalStatus(entry.status),
    detail: typeof entry.detail === 'string' ? entry.detail.trim() : '',
    date,
    created_at: typeof entry.created_at === 'string' && entry.created_at ? entry.created_at : new Date(`${date}T12:00:00Z`).toISOString(),
  }
}

export function sortTasks(tasks: LiveCampaignTask[]) {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'todo' ? -1 : 1
    if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    return b.created_at.localeCompare(a.created_at)
  })
}

export function sortLogsDesc(logs: LiveCampaignLog[]) {
  return [...logs].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.created_at.localeCompare(a.created_at)
  })
}

export function sortFeedbackDesc(entries: LiveCampaignClientFeedbackEntry[]) {
  return [...entries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.created_at.localeCompare(a.created_at)
  })
}

export function sortApprovalsDesc(entries: LiveCampaignApprovalEntry[]) {
  return [...entries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.created_at.localeCompare(a.created_at)
  })
}

export function parseLiveCampaignMetadata(input: string | null | undefined): LiveCampaignMetadata | null {
  if (!input) return null

  try {
    const parsed = JSON.parse(input) as Partial<LiveCampaignMetadata>

    if (parsed?.kind !== 'live_campaign') return null
    if (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) return null
    if (!parsed.client_name || !parsed.start_date || !parsed.seed_key) return null

    const platforms = Array.isArray(parsed.platforms)
      ? parsed.platforms
        .map((platform) => normalizePlatform(platform))
        .filter((platform): platform is LiveCampaignPlatform => Boolean(platform))
      : []

    return {
      kind: 'live_campaign',
      version: parsed.version,
      seed_key: parsed.seed_key,
      client_name: parsed.client_name,
      start_date: parsed.start_date,
      contract_days: Number(parsed.contract_days || 30),
      monthly_rate: Number(parsed.monthly_rate || 0),
      daily_target: Number(parsed.daily_target || 0),
      platforms: platforms.length ? platforms : [...LIVE_CAMPAIGN_PLATFORMS],
      logs: Array.isArray(parsed.logs)
        ? sortLogsDesc(parsed.logs.flatMap((log) => {
          const parsedLog = parseLog(log)
          return parsedLog ? [parsedLog] : []
        }))
        : [],
      internal_notes: typeof parsed.internal_notes === 'string' ? parsed.internal_notes : '',
      notes_updated_at: typeof parsed.notes_updated_at === 'string' && parsed.notes_updated_at ? parsed.notes_updated_at : null,
      tasks: Array.isArray(parsed.tasks)
        ? sortTasks(parsed.tasks.flatMap((task) => {
          const parsedTask = parseTask(task)
          return parsedTask ? [parsedTask] : []
        }))
        : [],
      client_feedback: Array.isArray(parsed.client_feedback)
        ? sortFeedbackDesc(parsed.client_feedback.flatMap((entry) => {
          const parsedEntry = parseFeedbackEntry(entry)
          return parsedEntry ? [parsedEntry] : []
        }))
        : [],
      approvals: Array.isArray(parsed.approvals)
        ? sortApprovalsDesc(parsed.approvals.flatMap((entry) => {
          const parsedEntry = parseApprovalEntry(entry)
          return parsedEntry ? [parsedEntry] : []
        }))
        : [],
    }
  } catch {
    return null
  }
}

export function createLiveCampaignMetadata(seed: LiveCampaignSeed, logs: LiveCampaignLog[] = []): LiveCampaignMetadata {
  return {
    kind: 'live_campaign',
    version: 3,
    seed_key: seed.seedKey,
    client_name: seed.clientName,
    start_date: seed.startDate,
    contract_days: seed.contractDays,
    monthly_rate: seed.monthlyRate,
    daily_target: seed.dailyTarget,
    platforms: [...seed.platforms],
    logs,
    internal_notes: '',
    notes_updated_at: null,
    tasks: [
      {
        id: crypto.randomUUID(),
        title: 'Confirm this week’s posting plan',
        detail: 'Use this as a running checklist for creator-side campaign management.',
        due_date: seed.startDate,
        status: 'todo',
        created_at: new Date(`${seed.startDate}T12:00:00Z`).toISOString(),
        completed_at: null,
      },
    ],
    client_feedback: [],
    approvals: [],
  }
}

export function serializeLiveCampaignMetadata(metadata: LiveCampaignMetadata) {
  return JSON.stringify(metadata)
}

export function computeLiveCampaignStats(metadata: LiveCampaignMetadata, now = new Date()): LiveCampaignStats {
  const today = startOfToday(now)
  const monthStart = startOfMonth(now)
  const weekStart = addDays(today, -6)
  const campaignStart = toUtcDateOnly(metadata.start_date)
  const daysActive = Math.max(0, Math.floor((today.getTime() - campaignStart.getTime()) / 86400000) + 1)
  const daysActiveWithinMonth = campaignStart > monthStart
    ? Math.max(0, Math.floor((today.getTime() - campaignStart.getTime()) / 86400000) + 1)
    : today.getUTCDate()

  const normalizedLogs = sortLogsDesc(metadata.logs)
  const postedLogs = normalizedLogs.filter((log) => log.status === 'posted' || log.status === 'approved')

  const isWithinRange = (value: string, start: Date, end: Date) => {
    const date = toUtcDateOnly(value)
    return date >= start && date <= end
  }

  const videosToday = postedLogs.filter((log) => isWithinRange(log.date, today, today)).length
  const videosThisWeek = postedLogs.filter((log) => isWithinRange(log.date, weekStart, today)).length
  const monthLogs = postedLogs.filter((log) => isWithinRange(log.date, monthStart, today))
  const videosThisMonth = monthLogs.length
  const viewsThisMonth = monthLogs.reduce((sum, log) => sum + Math.max(0, Number(log.views || 0)), 0)
  const totalVideos = postedLogs.length
  const totalViews = postedLogs.reduce((sum, log) => sum + Math.max(0, Number(log.views || 0)), 0)
  const elapsedForEarnings = Math.min(metadata.contract_days, daysActive)
  const earnedProrated = metadata.contract_days > 0
    ? Number(((metadata.monthly_rate / metadata.contract_days) * elapsedForEarnings).toFixed(2))
    : 0
  const monthlyTargetToDate = Math.max(0, daysActiveWithinMonth * metadata.daily_target)
  const progressPercent = monthlyTargetToDate > 0
    ? Math.min(100, Math.round((videosThisMonth / monthlyTargetToDate) * 100))
    : 0

  let status: LiveCampaignStatus = 'not_started'
  if (videosThisMonth === 0) {
    status = 'not_started'
  } else if (videosThisMonth >= monthlyTargetToDate) {
    status = 'on_track'
  } else {
    status = 'behind'
  }

  return {
    daysActive,
    videosToday,
    videosThisWeek,
    videosThisMonth,
    viewsThisMonth,
    totalVideos,
    totalViews,
    earnedProrated,
    monthlyTargetToDate,
    progressPercent,
    status,
  }
}

export function makeBrandEmail(seed: LiveCampaignSeed) {
  return `live-campaign+${seed.clientName.toLowerCase()}@ottougc.local`
}

export function buildJobDescription(seed: LiveCampaignSeed) {
  return [
    `${seed.clientName} live content retainer for Ed.`,
    `Start date: ${seed.startDate}.`,
    `Contract: ${seed.contractDays} days.`,
    `Platforms: ${seed.platforms.join(', ')}.`,
    'Deliverables: 1 repurposed video per platform per day (4/day total).',
    `Rate: $${seed.monthlyRate.toLocaleString()}/month.`,
  ].join(' ')
}

export function buildJobDeliverables(seed: LiveCampaignSeed) {
  return `1 video per day on ${seed.platforms.join(', ')} (${seed.dailyTarget} total posts per day).`
}
