import { Mux } from '@mux/mux-node'
import { NextRequest, NextResponse } from 'next/server'

function getMux() {
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret: process.env.MUX_TOKEN_SECRET || '',
  })
}

// GET /api/mux/upload-status?uploadId=xxx
// Check the status of a Mux upload and return the playbackId when ready
export async function GET(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get('uploadId')
  if (!uploadId) {
    return NextResponse.json({ error: 'uploadId required' }, { status: 400 })
  }

  try {
    const mux = getMux()

    // Retrieve the upload to get the asset ID
    const upload = await mux.video.uploads.retrieve(uploadId)

    if (!upload.asset_id) {
      return NextResponse.json({ status: upload.status })
    }

    // Retrieve the asset to get the playback ID
    const asset = await mux.video.assets.retrieve(upload.asset_id)
    const playbackId = asset.playback_ids?.[0]?.id

    return NextResponse.json({
      status: asset.status,
      assetId: upload.asset_id,
      playbackId,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Mux upload status]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}