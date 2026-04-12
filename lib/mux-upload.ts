/**
 * Mux video upload helper for Otto.
 *
 * Upload flow:
 *  1. Client requests a Mux upload URL from /api/mux/upload-url (server creates direct upload URL via Mux SDK)
 *  2. Client PUTs the video file directly to the Mux upload URL
 *  3. Mux automatically creates an Asset → we poll until playbackId is ready
 *  4. We store the playbackId in Supabase against the portfolio item
 *
 * Required env vars:
 *  - MUX_TOKEN_ID      (from Mux dashboard → Access Tokens)
 *  - MUX_TOKEN_SECRET  (from Mux dashboard → Access Tokens)
 *  - NEXT_PUBLIC_MUX_ENV_KEY (public env key for <MuxPlayer>)
 */

export interface MuxUploadResult {
  uploadId: string
  playbackId: string
}

/**
 * Upload a video file to Mux via a direct upload URL.
 * Returns the uploadId and playbackId once Mux has processed the video.
 */
export async function uploadToMux(
  file: File,
  userId: string,
  onProgress?: (pct: number) => void
): Promise<MuxUploadResult> {
  // 1. Get a direct upload URL from our API
  const res = await fetch('/api/mux/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, userId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Failed to get Mux upload URL: ${res.status}`)
  }

  const { uploadUrl, uploadId } = await res.json()

  // 2. PUT the file directly to Mux (no server in between)
  const xhr = new XMLHttpRequest()

  await new Promise<void>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Mux upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Mux upload network error')))
    xhr.addEventListener('abort', () => reject(new Error('Mux upload aborted')))

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
    xhr.send(file)
  })

  // 3. Poll for the playbackId via the uploadId
  const playbackId = await pollMuxAsset(uploadId)

  return { uploadId, playbackId }
}

async function pollMuxAsset(uploadId: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/mux/upload-status?uploadId=${uploadId}`)
    if (res.ok) {
      const data = await res.json()
      if (data.playbackId) return data.playbackId
      if (data.status === 'errored') throw new Error('Mux asset processing failed')
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Mux asset processing timed out')
}