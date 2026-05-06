import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

type BrandUpdatePayload = {
  company_name?: string
  bio?: string
  logo_url?: string
  industry?: string
  website?: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function normalizeOptional(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: brand, error: brandError } = await client
      .from('brands')
      .select('id, company_name, logo_url, bio, industry, website, created_at')
      .eq('id', id)
      .maybeSingle()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found.' }, { status: 404 })
    }

    const { data: jobs, error: jobsError } = await client
      .from('jobs')
      .select('id, title, budget_range, deadline, platforms, status')
      .eq('brand_id', id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...brand,
      active_briefs: jobs || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load brand profile.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
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

    const { data: existingBrand, error: existingBrandError } = await adminClient
      .from('brands')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle()

    if (existingBrandError || !existingBrand) {
      return NextResponse.json({ error: 'Brand not found.' }, { status: 404 })
    }

    if (existingBrand.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = (await request.json()) as BrandUpdatePayload

    const updatePayload = {
      company_name: normalizeOptional(body.company_name),
      bio: normalizeOptional(body.bio),
      logo_url: normalizeOptional(body.logo_url),
      industry: normalizeOptional(body.industry),
      website: normalizeOptional(body.website),
    }

    const { data: updatedBrand, error: updateError } = await adminClient
      .from('brands')
      .update(updatePayload)
      .eq('id', id)
      .select('id, company_name, logo_url, bio, industry, website, created_at, updated_at')
      .single()

    if (updateError || !updatedBrand) {
      return NextResponse.json({ error: updateError?.message || 'Could not update brand.' }, { status: 500 })
    }

    const trimmedCompanyName = normalizeOptional(body.company_name)

    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        role: 'brand',
        ...(trimmedCompanyName ? { company_name: trimmedCompanyName } : {}),
      },
    })

    return NextResponse.json({ ok: true, brand: updatedBrand })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update brand profile.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
