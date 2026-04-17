import { NextRequest, NextResponse } from 'next/server'
import { getEdAuthContext, parsePlatform } from '@/lib/ed-server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params

  const { data, error } = await auth.admin
    .from('campaign_posts')
    .select('id, campaign_id, video_url, platform, views, likes, posted_at, created_at')
    .eq('campaign_id', id)
    .order('posted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts: data || [] })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getEdAuthContext(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  const body = await request.json().catch(() => null)

  const videoUrl = String(body?.video_url || '').trim()
  const platform = parsePlatform(body?.platform)
  const views = Number(body?.views)
  const likesRaw = body?.likes
  const likes = likesRaw === null || likesRaw === undefined || likesRaw === '' ? null : Number(likesRaw)
  const postedAt = String(body?.posted_at || '').trim()

  if (!videoUrl || !platform || !Number.isFinite(views)) {
    return NextResponse.json({ error: 'video_url, valid platform, and numeric views are required.' }, { status: 400 })
  }

  if (likes !== null && !Number.isFinite(likes)) {
    return NextResponse.json({ error: 'likes must be numeric when provided.' }, { status: 400 })
  }

  const { data, error } = await auth.admin
    .from('campaign_posts')
    .insert({
      campaign_id: id,
      video_url: videoUrl,
      platform,
      views,
      likes,
      posted_at: postedAt || new Date().toISOString(),
    })
    .select('id, campaign_id, video_url, platform, views, likes, posted_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: data }, { status: 201 })
}
