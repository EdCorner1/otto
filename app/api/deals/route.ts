import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Role = 'brand' | 'creator'

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function getAuthContext(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return { error: 'Missing auth token.', status: 401 as const }

  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) {
    return { error: 'Not authenticated.', status: 401 as const }
  }

  const user = authData.user
  const [{ data: brandRow }, { data: creatorRow }, { data: userRow }] = await Promise.all([
    admin.from('brands').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('creators').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('users').select('role').eq('id', user.id).maybeSingle(),
  ])

  let role = (user.user_metadata?.role as Role | undefined) || (userRow?.role as Role | undefined)
  if (!role) {
    if (brandRow?.id && !creatorRow?.id) role = 'brand'
    else role = 'creator'
  }

  return {
    admin,
    user,
    role,
    brandId: brandRow?.id || null,
    creatorId: creatorRow?.id || null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const isBrand = auth.role === 'brand'
    const profileId = isBrand ? auth.brandId : auth.creatorId

    if (!profileId) {
      return NextResponse.json({ deals: [], role: auth.role })
    }

    const query = auth.admin
      .from('deals')
      .select('id, job_id, brand_id, creator_id, status, budget, amount, created_at, jobs(title), brands(company_name), creators(display_name)')
      .order('created_at', { ascending: false })

    const scopedQuery = isBrand
      ? query.eq('brand_id', profileId)
      : query.eq('creator_id', profileId)

    const { data, error } = await scopedQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      role: auth.role,
      deals: (data || []).map((deal) => ({
        ...deal,
        value: deal.budget ?? deal.amount ?? null,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch deals.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
