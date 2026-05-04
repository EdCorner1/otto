import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type CreatorRow = {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string | null
  creator_tags?: Array<{ tag: string | null }> | null
  creator_socials?: Array<{ platform: string | null; url: string | null }> | null
  portfolio_items?: Array<{ id: string; url: string | null; created_at: string | null }> | null
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function ownerEmails() {
  return (process.env.NEXT_PUBLIC_OTTO_OWNER_EMAILS || process.env.OTTO_OWNER_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  const authClient = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

function readTag(tags: Array<{ tag: string | null }> | null | undefined, prefix: string) {
  return (tags || [])
    .map((entry) => entry.tag || '')
    .find((tag) => tag.toLowerCase().startsWith(prefix))
    ?.slice(prefix.length)
    .trim() || ''
}

function hasTag(tags: Array<{ tag: string | null }> | null | undefined, prefix: string) {
  return (tags || []).some((entry) => (entry.tag || '').toLowerCase().startsWith(prefix))
}

function buildCreatorPayload(row: CreatorRow, emailByUserId: Map<string, string>) {
  const tags = row.creator_tags || []
  const socials = row.creator_socials || []
  const videos = row.portfolio_items || []
  const handle = readTag(tags, 'handle:')
  const introVideo = hasTag(tags, 'intro_video:')
  const brandLogos = tags.filter((entry) => (entry.tag || '').toLowerCase().startsWith('brand:')).length
  const reviews = tags.filter((entry) => (entry.tag || '').toLowerCase().startsWith('review:')).length
  const featuredWork = tags.filter((entry) => (entry.tag || '').toLowerCase().startsWith('featured:')).length
  const hasSocials = socials.filter((social) => social.platform && social.url).length > 0
  const videoCount = videos.filter((video) => video.url).length

  const missing = [
    !row.display_name?.trim() ? 'name' : '',
    !handle ? 'handle' : '',
    !row.avatar_url ? 'photo' : '',
    !row.bio?.trim() ? 'bio' : '',
    !hasSocials ? 'social links' : '',
    videoCount < 3 ? '3 videos' : '',
  ].filter(Boolean)

  const status = missing.length === 0 ? 'ready' : videoCount > 0 || row.bio || row.avatar_url ? 'needs_review' : 'incomplete'

  return {
    id: row.id,
    userId: row.user_id,
    email: emailByUserId.get(row.user_id) || '',
    name: row.display_name || 'Unnamed creator',
    handle,
    publicUrl: handle ? `https://ottougc.com/${handle}` : '',
    createdAt: row.created_at,
    videoCount,
    hasIntroVideo: introVideo,
    socialCount: socials.length,
    brandLogos,
    reviews,
    featuredWork,
    status,
    missing,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const email = (user?.email || '').toLowerCase().trim()
    if (!user || !ownerEmails().includes(email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: creators, error: creatorsError } = await admin
      .from('creators')
      .select('id, user_id, display_name, bio, avatar_url, created_at, creator_tags(tag), creator_socials(platform, url), portfolio_items(id, url, created_at)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (creatorsError) return NextResponse.json({ error: creatorsError.message }, { status: 500 })

    const userIds = Array.from(new Set(((creators || []) as CreatorRow[]).map((creator) => creator.user_id).filter(Boolean)))
    const { data: users, error: usersError } = userIds.length
      ? await admin.from('users').select('id, email').in('id', userIds)
      : { data: [], error: null }

    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

    const emailByUserId = new Map((users || []).map((row: { id: string; email: string | null }) => [row.id, row.email || '']))
    const rows = ((creators || []) as CreatorRow[]).map((creator) => buildCreatorPayload(creator, emailByUserId))

    return NextResponse.json({ creators: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load creators.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
