'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type ActiveBrief = {
  id: string
  title: string
  budget_range: string | null
  deadline: string | null
  platforms: string[] | null
  status: string
}

type BrandProfile = {
  id: string
  company_name: string | null
  logo_url: string | null
  bio: string | null
  industry: string | null
  website: string | null
  active_briefs: ActiveBrief[]
}

export default function BrandProfilePage() {
  const params = useParams()
  const brandId = params.id as string
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/brands/${brandId}`, { cache: 'no-store' })

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true)
        }
        setLoading(false)
        return
      }

      const data = (await response.json()) as BrandProfile
      setBrand(data)
      setLoading(false)
    }

    load()
  }, [brandId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !brand) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-20 text-center">
        <h1 style={{ fontSize: '32px', letterSpacing: '-0.5px', color: '#1c1c1e' }} className="mb-3">Brand not found</h1>
        <p className="text-[#6b6b6b] mb-6">This profile doesn&apos;t exist or has been removed.</p>
        <Link href="/brands" className="btn-primary inline-block">Browse brands</Link>
      </div>
    )
  }

  const brandName = brand.company_name || 'Unnamed brand'
  const activeBriefs = brand.active_briefs || []

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/brands" className="text-sm text-[#6b6b6b] hover:text-[#363535] transition-colors flex items-center gap-1.5">
          ← Back to brands
        </Link>
      </div>

      <div className="card mb-5">
        <div className="flex items-start gap-4 mb-5">
          {brand.logo_url ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#e8e8e4] bg-white flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logo_url} alt={brandName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#f0f0ec] border border-dashed border-[#d0d0cc] flex items-center justify-center text-2xl font-bold text-[#9a9a9a] flex-shrink-0">
              {brandName[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', letterSpacing: '-0.5px', color: '#1c1c1e' }}>
              {brandName}
            </h1>
            {brand.industry && (
              <span className="inline-flex mt-2 text-xs px-2.5 py-1 rounded-full bg-[#ccff00]/30 text-[#1c1c1e] font-semibold">
                {brand.industry}
              </span>
            )}
            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-xs text-[#6b6b6b] underline underline-offset-2 break-all"
              >
                {brand.website}
              </a>
            )}
          </div>
        </div>

        <p className="text-sm text-[#6b6b6b] leading-relaxed whitespace-pre-wrap">
          {brand.bio || 'No company description added yet.'}
        </p>
      </div>

      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e' }}>Active briefs</h2>
          <span className="text-xs text-[#9a9a9a]">{activeBriefs.length} open</span>
        </div>

        {activeBriefs.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No active briefs right now.</p>
        ) : (
          <div className="space-y-3">
            {activeBriefs.map((brief) => (
              <Link
                key={brief.id}
                href={`/jobs/${brief.id}`}
                className="block p-3 rounded-xl bg-[#fafaf9] hover:bg-[#f0f0ec] transition-colors"
              >
                <p className="text-sm font-semibold text-[#1c1c1e] truncate">{brief.title}</p>
                <div className="mt-1 text-xs text-[#6b6b6b] flex items-center gap-2 flex-wrap">
                  {brief.budget_range && <span>{brief.budget_range}</span>}
                  {brief.deadline && (
                    <span>· Due {new Date(brief.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                  {brief.platforms?.length ? <span>· {brief.platforms.join(', ')}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', letterSpacing: '-0.5px', color: '#1c1c1e' }} className="mb-3">About</h2>
        <p className="text-sm text-[#6b6b6b] leading-relaxed whitespace-pre-wrap">
          {brand.bio || 'No company description added yet.'}
        </p>
      </div>
    </div>
  )
}
