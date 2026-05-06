import { createClient } from '@supabase/supabase-js'

type PublicBrand = {
  id: string
  company_name: string
  logo_url: string | null
  bio: string | null
  industry: string | null
  website: string | null
  brand_slug: string | null
  is_public: boolean
  activeJobs: Array<{
    id: string
    title: string
    description: string | null
    platforms: string[]
    budget_min: number
    budget_max: number
    status: string
    created_at: string
  }>
}

function getEnv(name: string) {
  return process.env[name] ?? ''
}

export async function getPublicBrandBySlug(slug: string): Promise<PublicBrand | null> {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars')
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: brand, error } = await client
    .from('brands')
    .select('id, company_name, logo_url, bio, industry, website, brand_slug, is_public')
    .eq('brand_slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (error || !brand) return null

  const { data: jobs } = await client
    .from('jobs')
    .select('id, title, description, platforms, budget_min, budget_max, status, created_at')
    .eq('brand_id', brand.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return {
    ...brand,
    activeJobs: (jobs || []).map((j) => ({
      ...j,
      platforms: Array.isArray(j.platforms) ? j.platforms : [],
    })),
  }
}

export type { PublicBrand }