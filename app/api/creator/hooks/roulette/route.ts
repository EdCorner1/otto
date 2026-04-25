import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FALLBACK_HOOK_ROULETTE_ITEMS, type HookRouletteItem } from '@/lib/hook-roulette'

export const runtime = 'nodejs'

type CreatorProfileLite = {
  niche?: string | null
  skills?: unknown
  creator_tags?: Array<{ tag?: string | null }> | null
  creator_socials?: Array<{ platform?: string | null }> | null
}

type HookRow = {
  id: string
  hook_text?: string | null
  hook?: string | null
  text?: string | null
  type?: string | null
  source_url?: string | null
  source?: string | null
  suggested_script_angle?: string | null
  script_angle?: string | null
  cta_beat?: string | null
  cta?: string | null
  platform?: string | null
  niche?: string | null
  style_keywords?: string[] | null
  tags?: string[] | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function asArray(input: string | null): string[] {
  if (!input) return []
  return input
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function pickRandom<T>(items: T[], count: number) {
  if (items.length <= count) return items
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }
  return shuffled.slice(0, count)
}

function normalizeHookRow(row: HookRow): HookRouletteItem | null {
  const hookText = row.hook_text || row.hook || row.text
  const suggestedScriptAngle = row.suggested_script_angle || row.script_angle
  const ctaBeat = row.cta_beat || row.cta

  if (!hookText || !suggestedScriptAngle || !ctaBeat) return null

  return {
    id: row.id,
    hookText,
    type: row.type || 'general',
    sourceUrl: row.source_url || row.source || 'https://ottougc.com/resources/hooks',
    suggestedScriptAngle,
    ctaBeat,
    platform: row.platform || undefined,
    niche: row.niche || undefined,
    styleKeywords: (Array.isArray(row.style_keywords) ? row.style_keywords : Array.isArray(row.tags) ? row.tags : [])
      .map((item) => String(item || '').toLowerCase().trim())
      .filter(Boolean),
  }
}

function creatorPreferenceTokens(profile: CreatorProfileLite | null) {
  if (!profile) return { platforms: [] as string[], niches: [] as string[], styles: [] as string[] }

  const platforms = (Array.isArray(profile.creator_socials) ? profile.creator_socials : [])
    .map((row) => String(row?.platform || '').toLowerCase().trim())
    .filter(Boolean)

  const niches = [
    typeof profile.niche === 'string' ? profile.niche : '',
    ...(Array.isArray(profile.creator_tags)
      ? profile.creator_tags
        .map((row) => String(row?.tag || ''))
        .filter((tag) => tag.startsWith('niche:'))
        .map((tag) => tag.replace('niche:', ''))
      : []),
  ]
    .map((v) => v.toLowerCase().trim())
    .filter(Boolean)

  const styles = [
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile.creator_tags)
      ? profile.creator_tags
        .map((row) => String(row?.tag || ''))
        .filter((tag) => tag.startsWith('skill:'))
        .map((tag) => tag.replace('skill:', ''))
      : []),
  ]
    .map((v) => String(v).toLowerCase().trim())
    .filter(Boolean)

  return {
    platforms: Array.from(new Set(platforms)),
    niches: Array.from(new Set(niches)),
    styles: Array.from(new Set(styles)),
  }
}

function scoreHook(item: HookRouletteItem, filters: { platform: string[]; niche: string[]; styleKeywords: string[] }) {
  let score = 0

  if (filters.platform.length && item.platform && filters.platform.includes(item.platform.toLowerCase())) score += 4
  if (filters.niche.length && item.niche && filters.niche.includes(item.niche.toLowerCase())) score += 3

  const styleSet = new Set((item.styleKeywords || []).map((s) => s.toLowerCase()))
  for (const style of filters.styleKeywords) {
    if (styleSet.has(style)) score += 2
  }

  return score
}

function toDashboardIdea(item: HookRouletteItem) {
  return {
    id: item.id,
    hookStarter: item.hookText,
    type: item.type,
    sourceUrl: item.sourceUrl,
    scriptAngle: item.suggestedScriptAngle,
    ctaBeat: item.ctaBeat,
  }
}

async function fetchHookRows(admin: any) {
  const select = 'id, hook_text, hook, text, type, source_url, source, suggested_script_angle, script_angle, cta_beat, cta, platform, niche, style_keywords, tags'

  const primary = await admin
    .from('hook_roulette_hooks')
    .select(select)
    .eq('is_active', true)
    .limit(300)

  if (!primary.error && Array.isArray(primary.data) && primary.data.length) {
    return primary.data as HookRow[]
  }

  const secondary = await admin
    .from('hooks')
    .select(select)
    .limit(300)

  if (!secondary.error && Array.isArray(secondary.data) && secondary.data.length) {
    return secondary.data as HookRow[]
  }

  return []
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)

  const queryPlatform = asArray(url.searchParams.get('platform'))
  const queryNiche = asArray(url.searchParams.get('niche'))
  const queryStyles = asArray(url.searchParams.get('styleKeywords') || url.searchParams.get('style'))
  const limitParam = Number(url.searchParams.get('limit') || 1)
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 6) : 1

  const fallbackResult = (reason: string, personalizedWith?: { platform: string[]; niche: string[]; styleKeywords: string[] }) => {
    const fallbackPool = [...FALLBACK_HOOK_ROULETTE_ITEMS]
    const personalizedFilters = {
      platform: personalizedWith?.platform || queryPlatform,
      niche: personalizedWith?.niche || queryNiche,
      styleKeywords: personalizedWith?.styleKeywords || queryStyles,
    }

    const ranked = fallbackPool
      .map((item) => ({ item, score: scoreHook(item, personalizedFilters) }))
      .sort((a, b) => b.score - a.score)
      .map((row) => row.item)

    const hooks = pickRandom(ranked.slice(0, Math.max(4, limit * 2)), limit).map(toDashboardIdea)

    return NextResponse.json({
      hooks,
      source: 'fallback',
      fallbackReason: reason,
      personalization: personalizedFilters,
    })
  }

  try {
    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRole = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    let profileFilters = { platform: [] as string[], niche: [] as string[], styleKeywords: [] as string[] }

    if (token) {
      const { data: authData, error: authError } = await authClient.auth.getUser(token)
      if (!authError && authData.user?.id) {
        const { data: creatorProfile } = await admin
          .from('creators')
          .select('niche, skills, creator_tags(tag), creator_socials(platform)')
          .eq('user_id', authData.user.id)
          .maybeSingle()

        const prefs = creatorPreferenceTokens((creatorProfile || null) as CreatorProfileLite | null)
        profileFilters = {
          platform: prefs.platforms,
          niche: prefs.niches,
          styleKeywords: prefs.styles,
        }
      }
    }

    const mergedFilters = {
      platform: queryPlatform.length ? queryPlatform : profileFilters.platform,
      niche: queryNiche.length ? queryNiche : profileFilters.niche,
      styleKeywords: queryStyles.length ? queryStyles : profileFilters.styleKeywords,
    }

    const rows = await fetchHookRows(admin)
    const normalized = rows.map(normalizeHookRow).filter((item): item is HookRouletteItem => Boolean(item))

    if (!normalized.length) {
      return fallbackResult('no_hook_rows', mergedFilters)
    }

    const ranked = normalized
      .map((item) => ({ item, score: scoreHook(item, mergedFilters) }))
      .sort((a, b) => b.score - a.score)

    const targetPool = ranked.slice(0, Math.max(12, limit * 4)).map((row) => row.item)
    const hooks = pickRandom(targetPool.length ? targetPool : normalized, limit).map(toDashboardIdea)

    return NextResponse.json({
      hooks,
      source: 'db',
      personalization: mergedFilters,
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown_error'
    return fallbackResult(reason)
  }
}
