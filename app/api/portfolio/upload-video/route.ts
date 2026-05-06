import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  DIRECT_VIDEO_PLATFORM,
  PORTFOLIO_VIDEO_BUCKET,
  detectPortfolioPlatform,
  formatVideoTitleFromFilename,
  inferPortfolioThumbnail,
} from '@/lib/portfolio-media'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_VIDEOS = 6
const ALLOWED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])
const ALLOWED_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v'])

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function extensionForFile(file: File) {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase()
  if (fromName && ALLOWED_EXTENSIONS.has(fromName)) return fromName

  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/quicktime') return 'mov'
  if (file.type === 'video/webm') return 'webm'
  if (file.type === 'video/x-m4v') return 'm4v'
  return null
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

type StorageAdminClient = {
  storage: {
    listBuckets: () => Promise<{ data: Array<{ name?: string; id?: string }> | null; error: { message: string } | null }>
    createBucket: (
      id: string,
      options: { public: boolean; fileSizeLimit: number; allowedMimeTypes: string[] }
    ) => Promise<{ error: { message: string } | null }>
  }
}

async function ensureVideosBucket(admin: StorageAdminClient) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) throw new Error(listError.message)

  const existing = buckets?.find((bucket: { name?: string; id?: string }) => bucket.name === PORTFOLIO_VIDEO_BUCKET || bucket.id === PORTFOLIO_VIDEO_BUCKET)
  if (existing) return

  const { error: createError } = await admin.storage.createBucket(PORTFOLIO_VIDEO_BUCKET, {
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(createError.message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })

    const requesterId = await getAuthUserIdFromToken(token)
    if (!requesterId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const formData = await request.formData()
    const creatorId = String(formData.get('creatorId') || '').trim()
    const fileValue = formData.get('file')

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: 'Video file is required.' }, { status: 400 })
    }

    const extension = extensionForFile(fileValue)
    if (!extension || (!ALLOWED_TYPES.has(fileValue.type) && fileValue.type !== 'application/octet-stream')) {
      return NextResponse.json({ error: 'Unsupported video type. Upload MP4, MOV, or WebM.' }, { status: 400 })
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Video must be 100MB or smaller.' }, { status: 400 })
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

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((count || 0) >= MAX_VIDEOS) {
      return NextResponse.json({ error: 'You can only add up to 6 portfolio videos.' }, { status: 400 })
    }

    await ensureVideosBucket(admin)

    const filePath = `creators/${creatorId}/${randomUUID()}.${extension}`
    const arrayBuffer = await fileValue.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from(PORTFOLIO_VIDEO_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: fileValue.type || `video/${extension}`,
        upsert: false,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = admin.storage.from(PORTFOLIO_VIDEO_BUCKET).getPublicUrl(filePath)
    const publicUrl = publicUrlData.publicUrl
    const title = formatVideoTitleFromFilename(fileValue.name)
    const platform = detectPortfolioPlatform(publicUrl, DIRECT_VIDEO_PLATFORM)

    return NextResponse.json({
      ok: true,
      videoUrl: publicUrl,
      title,
      platform,
      thumbnailUrl: inferPortfolioThumbnail(publicUrl, platform),
      filePath,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload video.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
