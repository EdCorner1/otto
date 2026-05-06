import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

type RouteContext = { params: Promise<{ id: string }> }

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function extensionForFile(file: File) {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName

  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'image/avif') return 'avif'
  return 'bin'
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

async function ensureAvatarBucket(admin: StorageAdminClient) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) throw new Error(listError.message)

  const existing = buckets?.find((bucket: { name?: string; id?: string }) => bucket.name === AVATAR_BUCKET || bucket.id === AVATAR_BUCKET)
  if (existing) return

  const { error: createError } = await admin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(createError.message)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })

    const requesterId = await getAuthUserIdFromToken(token)
    if (!requesterId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const formData = await request.formData()
    const fileValue = formData.get('file')
    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: 'Profile photo file is required.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(fileValue.type)) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 })
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Profile photo must be 5MB or smaller.' }, { status: 400 })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: creator, error: creatorError } = await admin
      .from('creators')
      .select('id, user_id, avatar_url')
      .eq('id', id)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
    }

    if (creator.user_id !== requesterId) {
      return NextResponse.json({ error: 'You can only update your own profile.' }, { status: 403 })
    }

    await ensureAvatarBucket(admin)

    const extension = extensionForFile(fileValue)
    const filePath = `${creator.user_id}/${randomUUID()}.${extension}`

    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, fileValue, {
        contentType: fileValue.type,
        upsert: false,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
    const avatarUrl = publicUrlData.publicUrl

    return NextResponse.json({
      ok: true,
      avatarUrl,
      previousAvatarUrl: typeof creator.avatar_url === 'string' ? creator.avatar_url : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload profile photo.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
