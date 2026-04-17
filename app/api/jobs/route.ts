import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type CreateJobPayload = {
  title?: string
  description?: string
  jobType?: string
  targetPlatforms?: string[]
  audienceRequirement?: string
  contentFormat?: string
  numberOfPosts?: string
  ugcRightsNeeded?: 'yes' | 'no'
  budgetRange?: string
  payType?: string
  deadline?: string
}

function getEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export async function POST(request: NextRequest) {
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
    const payload = (await request.json()) as CreateJobPayload

    const title = payload.title?.trim() || ''
    const description = payload.description?.trim() || ''
    const jobType = payload.jobType?.trim() || ''
    const targetPlatforms = Array.isArray(payload.targetPlatforms) ? payload.targetPlatforms.filter(Boolean) : []
    const audienceRequirement = payload.audienceRequirement?.trim() || ''
    const contentFormat = payload.contentFormat?.trim() || ''
    const numberOfPosts = Number(payload.numberOfPosts || 0)
    const ugcRightsNeeded = payload.ugcRightsNeeded === 'no' ? 'No' : 'Yes'
    const budgetRange = payload.budgetRange?.trim() || ''
    const payType = payload.payType?.trim() || ''
    const deadline = payload.deadline?.trim() || ''

    if (!title || !description || !jobType) {
      return NextResponse.json({ error: 'Missing required job basics.' }, { status: 400 })
    }

    if (!targetPlatforms.length || !audienceRequirement || !contentFormat || numberOfPosts < 1) {
      return NextResponse.json({ error: 'Missing required requirement fields.' }, { status: 400 })
    }

    if (!budgetRange || !payType || !deadline) {
      return NextResponse.json({ error: 'Missing required budget fields.' }, { status: 400 })
    }

    const { data: brandData, error: brandError } = await adminClient
      .from('brands')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (brandError || !brandData?.id) {
      return NextResponse.json({ error: 'Brand profile not found.' }, { status: 403 })
    }

    const deliverables = [
      `${numberOfPosts} post${numberOfPosts > 1 ? 's' : ''}`,
      `UGC rights: ${ugcRightsNeeded}`,
      `Audience: ${audienceRequirement}`,
      `Format: ${contentFormat}`,
      `Pay type: ${payType}`,
    ]

    const { data: created, error: insertError } = await adminClient
      .from('jobs')
      .insert({
        brand_id: brandData.id,
        title,
        description,
        category: jobType,
        platforms: targetPlatforms,
        deliverables,
        budget_range: budgetRange,
        timeline: deadline,
        status: 'open',
      })
      .select('id')
      .single()

    if (insertError || !created?.id) {
      throw new Error(insertError?.message || 'Failed to create job.')
    }

    return NextResponse.json({ ok: true, id: created.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create job.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
