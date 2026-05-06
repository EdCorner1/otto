import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
  buildCloudflareStreamUrl,
  buildCloudflareThumbnailUrl,
} from '@/lib/cloudflare-media'
import { MAX_PORTFOLIO_VIDEOS, MAX_VIDEO_SIZE_BYTES } from '@/lib/portfolio-media'

export const runtime = 'nodejs'

const ALLOWED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])
const ALLOWED_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v'])

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function isAllowedVideo(input: { fileName?: string; fileType?: string }) {
  const extension = input.fileName?.split('.').pop()?.trim().toLowerCase()
  return Boolean(
    (input.fileType && ALLOWED_TYPES.has(input.fileType)) ||
    (extension && ALLOWED_EXTENSIONS.has(extension))
  )
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })

    const requesterId = await getAuthUserIdFromToken(token)
    if (!requesterId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = await request.json().catch(() => null) as {
      creatorId?: string
      fileName?: string
      fileType?: string
      fileSize?: number
    } | null

    const creatorId = String(body?.creatorId || '').trim()
    const fileName = String(body?.fileName || '').trim()
    const fileType = String(body?.fileType || '').trim()
    const fileSize = Number(body?.fileSize || 0)

    if (!creatorId) return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    if (!fileName) return NextResponse.json({ error: 'File name is required.' }, { status: 400 })
    if (!isAllowedVideo({ fileName, fileType })) {
      return NextResponse.json({ error: 'Unsupported video type. Upload MP4, MOV, WebM, or M4V.' }, { status: 400 })
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: 'File size is required.' }, { status: 400 })
    }
    if (fileSize > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Video must be ${Math.round(MAX_VIDEO_SIZE_BYTES / 1024 / 1024)}MB or smaller.` },
        { status: 400 }
      )
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, user_id')
      .eq('id', creatorId)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
    }

    if (creator.user_id !== requesterId) {
      return NextResponse.json({ error: 'You can only upload videos to your own profile.' }, { status: 403 })
    }

    const { count, error: countError } = await admin
      .from('portfolio_items')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creatorId)

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
    if ((count || 0) >= MAX_PORTFOLIO_VIDEOS) {
      return NextResponse.json({ error: `You can only add up to ${MAX_PORTFOLIO_VIDEOS} portfolio videos.` }, { status: 400 })
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json({ error: 'Cloudflare Stream uploads are not configured.' }, { status: 500 })
    }

    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 600,
          expiry,
          meta: {
            creatorId,
            fileName,
            source: 'otto-portfolio',
          },
        }),
      }
    )

    const cloudflareData = await cloudflareResponse.json()
    if (!cloudflareResponse.ok || !cloudflareData.success) {
      const message = cloudflareData.errors?.[0]?.message || cloudflareData.message || 'Could not create upload URL.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const mediaId = cloudflareData.result?.uid
    const uploadUrl = cloudflareData.result?.uploadURL
    if (!mediaId || !uploadUrl) {
      return NextResponse.json({ error: 'Cloudflare did not return an upload URL.' }, { status: 500 })
    }

    const title = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')

    return NextResponse.json({
      ok: true,
      uploadUrl,
      mediaId,
      videoUrl: buildCloudflareStreamUrl(mediaId),
      thumbnailUrl: buildCloudflareThumbnailUrl(mediaId),
      platform: 'Cloudflare',
      title,
      expiresAt: expiry,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create upload URL.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
