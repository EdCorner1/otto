import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { DEFAULT_ED_EMAILS, isEdUser } from '@/lib/ed-auth'

export type EdAuthSuccess = {
  admin: any
  user: {
    id: string
    email?: string | null
    user_metadata?: {
      role?: string
      is_admin?: boolean
      admin?: boolean
    }
  }
}

export type EdAuthError = {
  error: string
  status: 401 | 403 | 500
}

export const ED_CAMPAIGN_STATUSES = ['active', 'paused', 'completed'] as const
export const ED_PLATFORMS = ['TikTok', 'Instagram/Reels', 'YouTube', 'Facebook'] as const
export const ED_GOAL_PLATFORMS = [...ED_PLATFORMS, 'All'] as const
export const ED_GOAL_STATUSES = ['not_started', 'behind', 'on_track', 'complete'] as const

export type EdGoalStatus = (typeof ED_GOAL_STATUSES)[number]

export type GoalProgress = {
  target: number
  actual: number
  expected_pace: number
  progress_percent: number
  status: EdGoalStatus
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function getAllowedEmails() {
  const fromEnv = process.env.OTTO_PLATFORM_ALLOWED_EMAILS
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (fromEnv?.length) return fromEnv
  return DEFAULT_ED_EMAILS
}

export function toMonthStartIso(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString()
}

export function getMonthDateRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    daysElapsed: date.getUTCDate(),
    totalDaysInMonth: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(),
  }
}

export function computeGoalProgress(params: {
  targetPerMonth: number
  actualPostsThisMonth: number
  daysElapsed: number
  totalDaysInMonth: number
}): GoalProgress {
  const target = Math.max(0, Number(params.targetPerMonth) || 0)
  const actual = Math.max(0, Number(params.actualPostsThisMonth) || 0)
  const totalDays = Math.max(1, Number(params.totalDaysInMonth) || 1)
  const elapsed = Math.min(totalDays, Math.max(1, Number(params.daysElapsed) || 1))

  const expectedPace = target > 0 ? (elapsed / totalDays) * target : 0
  const progressPercent = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0

  let status: EdGoalStatus = 'not_started'

  if (actual === 0) {
    status = 'not_started'
  } else if (target > 0 && actual >= target) {
    status = 'complete'
  } else if (actual >= expectedPace) {
    status = 'on_track'
  } else {
    status = 'behind'
  }

  return {
    target,
    actual,
    expected_pace: Math.round(expectedPace * 100) / 100,
    progress_percent: progressPercent,
    status,
  }
}

export async function getEdAuthContext(request: NextRequest): Promise<EdAuthSuccess | EdAuthError> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) return { error: 'Missing auth token.', status: 401 }

  try {
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } = await authClient.auth.getUser(token)

    if (authError || !authData.user) {
      return { error: 'Not authenticated.', status: 401 }
    }

    const user = authData.user
    const allowedEmails = getAllowedEmails()
    const email = (user.email || '').toLowerCase().trim()

    if (!allowedEmails.includes(email) && !isEdUser(user)) {
      return { error: 'Forbidden', status: 403 }
    }

    return {
      admin,
      user,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth setup failed.'
    return { error: message, status: 500 }
  }
}

export function parseStatus(input: unknown): (typeof ED_CAMPAIGN_STATUSES)[number] | null {
  if (typeof input !== 'string') return null
  return ED_CAMPAIGN_STATUSES.includes(input as (typeof ED_CAMPAIGN_STATUSES)[number])
    ? (input as (typeof ED_CAMPAIGN_STATUSES)[number])
    : null
}

function normalizePlatformLabel(value: string): (typeof ED_PLATFORMS)[number] | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (lower === 'instagram' || lower === 'reels' || lower === 'instagram/reels') return 'Instagram/Reels'
  if (lower === 'tiktok') return 'TikTok'
  if (lower === 'youtube') return 'YouTube'
  if (lower === 'facebook') return 'Facebook'

  return ED_PLATFORMS.includes(trimmed as (typeof ED_PLATFORMS)[number])
    ? (trimmed as (typeof ED_PLATFORMS)[number])
    : null
}

export function parsePlatforms(input: unknown): string[] {
  if (!Array.isArray(input)) return []

  const normalized = input
    .map((value) => (typeof value === 'string' ? normalizePlatformLabel(value) : null))
    .filter((value): value is (typeof ED_PLATFORMS)[number] => Boolean(value))

  return Array.from(new Set(normalized))
}

export function parsePlatform(input: unknown): (typeof ED_PLATFORMS)[number] | null {
  if (typeof input !== 'string') return null
  return normalizePlatformLabel(input)
}

export function parseGoalPlatform(input: unknown): (typeof ED_GOAL_PLATFORMS)[number] | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.toLowerCase() === 'all') return 'All'
  return normalizePlatformLabel(trimmed)
}

export function parseOptionalUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const value = input.trim()
  return value || null
}

export function parseTargetPosts(input: unknown): number {
  const value = Number(input)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}
