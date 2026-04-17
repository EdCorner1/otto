import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'creator' | 'brand'

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
      return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 })
    }

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } = await authClient.auth.getUser(token)
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const user = authData.user
    const { id } = await params
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const role = body?.role as Role | undefined
    const onboardingProfile = body?.profile && typeof body.profile === 'object' ? body.profile : null

    const userUpdate: Record<string, unknown> = {
      onboarding_complete: true,
    }

    if (role === 'creator' || role === 'brand') {
      userUpdate.role = role
    }

    const { error: userError } = await adminClient
      .from('users')
      .update(userUpdate)
      .eq('id', user.id)

    if (userError) {
      throw new Error(`User update failed: ${userError.message}`)
    }

    const nextMetadata = {
      ...(user.user_metadata || {}),
      onboarding_complete: true,
      role: role === 'creator' || role === 'brand' ? role : user.user_metadata?.role,
      onboarding_profile: onboardingProfile,
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: nextMetadata,
    })

    if (authUpdateError) {
      throw new Error(`Auth metadata update failed: ${authUpdateError.message}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not complete onboarding.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleRequest(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleRequest(request, context)
}
