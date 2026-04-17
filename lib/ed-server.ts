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
export const ED_PLATFORMS = ['TikTok', 'Instagram', 'YouTube'] as const

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

export function parsePlatforms(input: unknown): string[] {
  if (!Array.isArray(input)) return []

  const normalized = input
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .filter((value): value is (typeof ED_PLATFORMS)[number] =>
      ED_PLATFORMS.includes(value as (typeof ED_PLATFORMS)[number])
    )

  return Array.from(new Set(normalized))
}

export function parsePlatform(input: unknown): (typeof ED_PLATFORMS)[number] | null {
  if (typeof input !== 'string') return null
  return ED_PLATFORMS.includes(input as (typeof ED_PLATFORMS)[number])
    ? (input as (typeof ED_PLATFORMS)[number])
    : null
}
