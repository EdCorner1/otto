import { NextRequest, NextResponse } from 'next/server'
import {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
  buildCloudflareStreamUrl,
} from '@/lib/cloudflare-media'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])

async function streamToCloudflare(file: File): Promise<{ videoUrl: string; thumbnailUrl: string; mediaId: string }> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/copy`

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
    body: formData,
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    const msg = data.errors?.[0]?.message || data.message || 'Upload failed'
    throw new Error(msg)
  }

  const mediaId: string = data.result?.id
  if (!mediaId) throw new Error('No media ID returned')

  return {
    mediaId,
    videoUrl: buildCloudflareStreamUrl(mediaId),
    thumbnailUrl: `https://customer-hl0vh4j6c5g7f8bb.cloudflarestream.com/${mediaId}/thumb.jpg`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const creatorId = formData.get('creatorId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: MP4, MOV, WebM.' }, { status: 400 })
    }

    if (!creatorId) {
      return NextResponse.json({ error: 'Missing creatorId.' }, { status: 400 })
    }

    const result = await streamToCloudflare(file)

    return NextResponse.json({
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      mediaId: result.mediaId,
      platform: 'Cloudflare',
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
