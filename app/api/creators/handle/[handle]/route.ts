import { NextRequest, NextResponse } from 'next/server'
import { getPublicCreatorPortfolioByHandle } from '@/lib/public-creator-portfolio'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ handle: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { handle } = await context.params
    const portfolio = await getPublicCreatorPortfolioByHandle(handle)

    if (!portfolio) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    return NextResponse.json(portfolio)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch creator portfolio.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
