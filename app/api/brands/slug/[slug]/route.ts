import { NextRequest, NextResponse } from 'next/server'
import { getPublicBrandBySlug } from '@/lib/public-brand-portfolio'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { slug } = await context.params

    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Brand slug is required.' }, { status: 400 })
    }

    const brand = await getPublicBrandBySlug(slug.trim())

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found or not public.' }, { status: 404 })
    }

    return NextResponse.json(brand)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load brand.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}