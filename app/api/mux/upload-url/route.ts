import { Mux } from '@mux/mux-node'
import { NextRequest, NextResponse } from 'next/server'

// Mux server-side client (for upload URL generation)
function getMux() {
  const tokenSecret = process.env.MUX_TOKEN_SECRET
  if (!tokenSecret) {
    throw new Error('MUX_TOKEN_SECRET is not set')
  }
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret,
  })
}

// POST /api/mux/upload-url
// Creates a direct upload URL and returns { uploadUrl, playbackId }
export async function POST(req: NextRequest) {
  try {
    const { filename, userId } = await req.json()

    if (!filename || !userId) {
      return NextResponse.json({ error: 'filename and userId required' }, { status: 400 })
    }

    const mux = getMux()

    // Create a Mux asset via direct upload
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'capped_1080p',
      },
      cors_origin: '*',
    })

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create Mux upload URL'
    console.error('[Mux upload URL]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}