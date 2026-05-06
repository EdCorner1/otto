import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type CreatorRow = {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  profile_views: number | null
  created_at: string
  updated_at: string | null
  creator_socials?: Array<{ platform: string | null }>
  creator_tags?: Array<{ tag: string | null }>
  portfolio_items?: Array<{
    id: string
    thumbnail_url: string | null
    url: string
    type: string | null
    created_at: string
    sort_order: number | null
  }>
}

type CreatorPayload = {
  id: string
  name: string
  handle: string
  avatarUrl: string | null
  headline: string | null
  mainPlatform: string
  followerRange: string
  incomeLevel: string
  contentTypes: string[]
  nicheTags: string[]
  topPortfolioThumbnail: string | null
  profileViews: number
  createdAt: string
  updatedAt: string | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function parseTags(tags: Array<{ tag: string | null }> | undefined) {
  const safeTags = (tags || []).map((entry) => entry.tag || '').filter(Boolean)

  const readSingle = (prefixes: string[]) => {
    for (const prefix of prefixes) {
      const match = safeTags.find((tag) => tag.toLowerCase().startsWith(prefix))
      if (match) return match.slice(prefix.length).trim()
    }
    return ''
  }

  const readMulti = (prefixes: string[]) => {
    const values = safeTags
      .flatMap((tag) => {
        const normalized = tag.toLowerCase()
        const prefix = prefixes.find((candidate) => normalized.startsWith(candidate))
        if (!prefix) return [] as string[]
        const value = tag.slice(prefix.length).trim()
        return value ? [value] : []
      })
      .filter(Boolean)

    return Array.from(new Set(values))
  }

  return {
    handle: readSingle(['handle:']),
    mainPlatform: normalize(readSingle(['main_platform:', 'platform:'])),
    followerRange: readSingle(['followers:', 'follower_range:', 'reach:']),
    incomeLevel: readSingle(['income:', 'income_level:']),
    nicheTags: readMulti(['niche:']),
    contentTypes: readMulti(['content_type:', 'content:', 'type:']),
  }
}

function inferMainPlatform(
  explicitPlatform: string,
  socials: Array<{ platform: string | null }> | undefined,
) {
  if (explicitPlatform) return explicitPlatform
  const firstKnown = (socials || [])
    .map((social) => normalize(social.platform))
    .find((platform) => ['tiktok', 'instagram', 'youtube'].includes(platform))
  return firstKnown || ''
}

function followerRangeScore(range: string) {
  const value = normalize(range)
  const scores: Record<string, number> = {
    '< 1k': 1,
    '1k – 10k': 2,
    '1k - 10k': 2,
    '1k – 50k': 3,
    '1k - 50k': 3,
    '10k – 50k': 4,
    '10k - 50k': 4,
    '50k – 250k': 5,
    '50k - 250k': 5,
    '50k – 500k': 6,
    '50k - 500k': 6,
    '250k – 500k': 7,
    '250k - 500k': 7,
    '500k +': 8,
    '500k+': 8,
    '1m +': 9,
    '1m+': 9,
  }
  return scores[value] || 0
}

function creatorFromRow(row: CreatorRow): CreatorPayload {
  const tags = parseTags(row.creator_tags)
  const sortedPortfolio = [...(row.portfolio_items || [])].sort((a, b) => {
    const sortA = a.sort_order ?? 9999
    const sortB = b.sort_order ?? 9999
    if (sortA !== sortB) return sortA - sortB
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const headlineTag = (row.creator_tags || [])
    .map((entry) => entry.tag || '')
    .find((tag) => tag.toLowerCase().startsWith('headline:'))
  const headline = headlineTag ? headlineTag.slice('headline:'.length).trim() : null

  const topItem = sortedPortfolio[0]
  const topThumbnail = topItem?.thumbnail_url || (topItem?.type === 'image' ? topItem.url : null)

  return {
    id: row.id,
    name: row.display_name || 'Creator',
    handle: tags.handle,
    avatarUrl: row.avatar_url,
    headline,
    mainPlatform: inferMainPlatform(tags.mainPlatform, row.creator_socials),
    followerRange: tags.followerRange,
    incomeLevel: tags.incomeLevel,
    contentTypes: tags.contentTypes,
    nicheTags: tags.nicheTags,
    topPortfolioThumbnail: topThumbnail,
    profileViews: row.profile_views || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { searchParams } = new URL(request.url)
    const platform = normalize(searchParams.get('platform'))
    const followerRange = normalize(searchParams.get('follower_range'))
    const niche = normalize(searchParams.get('niche'))
    const contentType = normalize(searchParams.get('content_type'))
    const incomeLevel = normalize(searchParams.get('income_level'))
    const query = (searchParams.get('q') || '').trim().toLowerCase()
    const sort = normalize(searchParams.get('sort')) || 'newest'

    const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
    const pageSize = Math.max(1, Math.min(50, Number(searchParams.get('page_size') || '12') || 12))

    const { data: creatorUsers, error: usersError } = await admin
      .from('users')
      .select('id')
      .eq('role', 'creator')

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const creatorUserIds = (creatorUsers || []).map((user) => user.id)

    if (!creatorUserIds.length) {
      return NextResponse.json({ creators: [], total: 0, page, pageSize, totalPages: 0 })
    }

    const { data: creatorRows, error: creatorsError } = await admin
      .from('creators')
      .select('id, user_id, display_name, avatar_url, profile_views, created_at, updated_at, creator_socials(platform), creator_tags(tag), portfolio_items(id, thumbnail_url, url, type, created_at, sort_order)')
      .in('user_id', creatorUserIds)

    if (creatorsError) {
      return NextResponse.json({ error: creatorsError.message }, { status: 500 })
    }

    const normalizedCreators = ((creatorRows as CreatorRow[]) || []).map(creatorFromRow)

    const filtered = normalizedCreators.filter((creator) => {
      if (platform && normalize(creator.mainPlatform) !== platform) return false
      if (followerRange && normalize(creator.followerRange) !== followerRange) return false
      if (niche && !creator.nicheTags.some((tag) => normalize(tag) === niche)) return false
      if (contentType && !creator.contentTypes.some((type) => normalize(type) === contentType)) return false
      if (incomeLevel && normalize(creator.incomeLevel) !== incomeLevel) return false

      if (query) {
        const haystack = [creator.name, creator.handle, creator.headline || '', creator.nicheTags.join(' ')].join(' ').toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })

    filtered.sort((a, b) => {
      if (sort === 'most_active') {
        if (b.profileViews !== a.profileViews) return b.profileViews - a.profileViews
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      }

      if (sort === 'highest_follower_range') {
        const followerDelta = followerRangeScore(b.followerRange) - followerRangeScore(a.followerRange)
        if (followerDelta !== 0) return followerDelta
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginated = filtered.slice(start, end)

    return NextResponse.json({
      creators: paginated,
      total,
      page,
      pageSize,
      totalPages,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch creators.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
