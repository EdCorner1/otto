import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

type PortfolioInput = {
  url: string
  platform: string
  caption?: string
}

type PatchPayload = {
  fullName?: string
  handle?: string
  bio?: string
  avatarUrl?: string | null
  mainPlatform?: string
  followerRange?: string
  incomeRange?: string
  nicheTags?: string[]
  portfolioItems?: PortfolioInput[]
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function cleanOptionalUrl(value: string | null | undefined) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function inferType(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url) ? 'image' : 'video'
}

function inferThumbnail(url: string, platform: string) {
  if (platform === 'youtube') {
    const youtubeMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (youtubeMatch?.[1]) return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
  }

  if (inferType(url) === 'image') return url
  return null
}

function parseCreatorMeta(tags: Array<{ tag: string }>) {
  const read = (prefix: string) => tags.find((t) => t.tag.startsWith(prefix))?.tag.replace(prefix, '').trim() || ''
  return {
    handle: read('handle:'),
    mainPlatform: read('main_platform:'),
    followerRange: read('followers:'),
    incomeRange: read('income:'),
    nicheTags: tags
      .filter((t) => t.tag.startsWith('niche:'))
      .map((t) => t.tag.replace('niche:', '').trim())
      .filter(Boolean),
  }
}

async function getAuthUserIdFromToken(token: string) {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await admin
      .from('creators')
      .select('id, user_id, display_name, bio, avatar_url, creator_socials(platform, url), creator_tags(tag), portfolio_items(id, url, type, platform, caption, thumbnail_url, created_at, sort_order)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const tags = (data.creator_tags || []) as Array<{ tag: string }>
    const meta = parseCreatorMeta(tags)

    const portfolioItems = ((data.portfolio_items || []) as Array<{
      id: string
      url: string
      type: string
      platform: string | null
      caption: string | null
      thumbnail_url: string | null
      created_at: string
      sort_order: number | null
    }>).sort((a, b) => {
      const aSort = a.sort_order ?? 9999
      const bSort = b.sort_order ?? 9999
      if (aSort !== bSort) return aSort - bSort
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({
      id: data.id,
      userId: data.user_id,
      fullName: data.display_name || '',
      handle: meta.handle,
      bio: data.bio || '',
      avatarUrl: data.avatar_url || null,
      mainPlatform: meta.mainPlatform,
      followerRange: meta.followerRange,
      incomeRange: meta.incomeRange,
      nicheTags: meta.nicheTags,
      socials: data.creator_socials || [],
      portfolioItems,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch creator profile.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })

    const requesterId = await getAuthUserIdFromToken(token)
    if (!requesterId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = (await request.json()) as PatchPayload
    const fullName = cleanText(body.fullName || '')
    const handle = cleanText(body.handle || '').replace(/^@+/, '')
    const bio = (body.bio || '').trim()
    const avatarUrl = cleanOptionalUrl(body.avatarUrl)
    const mainPlatform = normalizeTag(body.mainPlatform || '')
    const followerRange = (body.followerRange || '').trim()
    const incomeRange = (body.incomeRange || '').trim()
    const nicheTags = Array.isArray(body.nicheTags)
      ? body.nicheTags.map((tag) => cleanText(tag)).filter(Boolean).slice(0, 8)
      : []
    const portfolioItems = Array.isArray(body.portfolioItems)
      ? body.portfolioItems
          .map((item) => ({
            url: String(item.url || '').trim(),
            platform: normalizeTag(String(item.platform || '')),
            caption: (item.caption || '').trim(),
          }))
          .filter((item) => item.url && item.platform)
          .slice(0, 6)
      : []

    if (!fullName || !handle || !bio || !mainPlatform) {
      return NextResponse.json({ error: 'Full name, handle, bio, and main platform are required.' }, { status: 400 })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
    }

    if (creator.user_id !== requesterId) {
      return NextResponse.json({ error: 'You can only update your own profile.' }, { status: 403 })
    }

    const { error: updateError } = await admin
      .from('creators')
      .update({
        display_name: fullName,
        bio,
        avatar_url: avatarUrl,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { data: existingTags } = await admin
      .from('creator_tags')
      .select('id, tag')
      .eq('creator_id', id)

    const managedTagPrefixes = ['handle:', 'main_platform:', 'followers:', 'income:', 'niche:']
    const managedIds = (existingTags || [])
      .filter((t: { tag: string }) => managedTagPrefixes.some((prefix) => t.tag.startsWith(prefix)))
      .map((t: { id: string }) => t.id)

    if (managedIds.length > 0) {
      const { error: deleteTagsError } = await admin.from('creator_tags').delete().in('id', managedIds)
      if (deleteTagsError) return NextResponse.json({ error: deleteTagsError.message }, { status: 500 })
    }

    const tagPayload = [
      `handle:${handle}`,
      `main_platform:${mainPlatform}`,
      ...(followerRange ? [`followers:${followerRange}`] : []),
      ...(incomeRange ? [`income:${incomeRange}`] : []),
      ...nicheTags.map((tag) => `niche:${tag}`),
    ].map((tag) => ({ creator_id: id, tag }))

    if (tagPayload.length > 0) {
      const { error: insertTagError } = await admin.from('creator_tags').insert(tagPayload)
      if (insertTagError) return NextResponse.json({ error: insertTagError.message }, { status: 500 })
    }

    const { error: deletePortfolioError } = await admin.from('portfolio_items').delete().eq('creator_id', id)
    if (deletePortfolioError) return NextResponse.json({ error: deletePortfolioError.message }, { status: 500 })

    if (portfolioItems.length > 0) {
      const portfolioPayload = portfolioItems.map((item, index) => ({
        creator_id: id,
        url: item.url,
        platform: item.platform,
        caption: item.caption || null,
        type: inferType(item.url),
        thumbnail_url: inferThumbnail(item.url, item.platform),
        sort_order: index,
      }))

      const { error: insertPortfolioError } = await admin.from('portfolio_items').insert(portfolioPayload)
      if (insertPortfolioError) return NextResponse.json({ error: insertPortfolioError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update creator profile.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
