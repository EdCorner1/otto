'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Globe, ExternalLink, Briefcase } from 'lucide-react'
import type { PublicBrand } from '@/lib/public-brand-portfolio'

type RouteContext = { params: Promise<{ slug: string }> }

export default function PublicBrandPage({ params }: RouteContext) {
  const [slug, setSlug] = useState<string>('')
  const [brand, setBrand] = useState<PublicBrand | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    const load = async () => {
      try {
        const res = await fetch(`/api/brands/slug/${slug}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) setNotFound(true)
          setLoading(false)
          return
        }
        setBrand(await res.json())
      } catch {
        setNotFound(true)
      }
      setLoading(false)
    }

    load()
  }, [slug])

  if (loading || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf9] gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-[#f0f0ec] flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-[#6b6b6b]" />
        </div>
        <div className="text-center">
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '24px', letterSpacing: '-0.5px', color: '#363535' }}>
            Brand not found
          </h1>
          <p className="text-[#6b6b6b] mt-2 text-sm">This brand page doesn&apos;t exist or isn&apos;t public yet.</p>
        </div>
        <Link href="/" className="mt-2 text-sm font-medium text-[#1c1c1e] hover:text-[#6b6b6b] transition-colors">
          ← Back to Otto
        </Link>
      </div>
    )
  }

  if (!brand) return null

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="bg-white border-b border-[#ecece8]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>
              Otto
            </span>
            <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
          </Link>
          <div className="flex items-center gap-3">
            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#6b6b6b] hover:text-[#1c1c1e] transition-colors"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
            <Link
              href="/brands"
              className="text-sm font-medium text-[#6b6b6b] hover:text-[#1c1c1e] transition-colors"
            >
              All brands
            </Link>
          </div>
        </div>
      </header>

      {/* Brand Hero */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className="w-24 h-24 rounded-2xl bg-white border border-[#ecece8] flex items-center justify-center overflow-hidden flex-shrink-0">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.company_name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '32px', letterSpacing: '-1px', color: '#363535' }}>
                {brand.company_name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.5px', color: '#363535', lineHeight: 1.1 }}>
                  {brand.company_name}
                </h1>
                {brand.industry && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#f0f0ec] text-xs font-medium text-[#6b6b6b]">
                    {brand.industry}
                  </span>
                )}
              </div>
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ecece8] text-sm font-medium text-[#363535] hover:bg-[#f7f7f5] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit site
                </a>
              )}
            </div>

            {brand.bio && (
              <p className="mt-4 text-[#6b6b6b] text-sm leading-relaxed max-w-2xl">
                {brand.bio}
              </p>
            )}
          </div>
        </div>

        {/* Active briefs */}
        {brand.activeJobs.length > 0 && (
          <div className="mt-12">
            <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.3px', color: '#363535' }}>
              Open briefs
            </h2>
            <p className="text-sm text-[#6b6b6b] mt-1">
              {brand.activeJobs.length} active campaign{brand.activeJobs.length !== 1 ? 's' : ''}
            </p>

            <div className="mt-6 space-y-4">
              {brand.activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-[#ecece8] p-6 hover:border-[#d0d0cc] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 600, fontSize: '16px', color: '#363535' }}>
                        {job.title}
                      </h3>
                      {job.description && (
                        <p className="mt-2 text-sm text-[#6b6b6b] line-clamp-2">
                          {job.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-4 flex-wrap">
                        {job.platforms.length > 0 && (
                          <div className="flex items-center gap-2">
                            {job.platforms.map((p) => (
                              <span
                                key={p}
                                className="px-2.5 py-1 rounded-full bg-[#f0f0ec] text-xs font-medium text-[#363535]"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {job.budget_min > 0 && job.budget_max > 0 && (
                          <span className="text-sm font-medium text-[#363535]">
                            ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${job.id}/apply`}
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {brand.activeJobs.length === 0 && (
          <div className="mt-12 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f0f0ec] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-[#6b6b6b]" />
            </div>
            <p className="text-[#6b6b6b] text-sm">No active campaigns right now.</p>
            <Link
              href="/creators"
              className="mt-3 inline-block text-sm font-medium text-[#363535] hover:text-[#6b6b6b] transition-colors"
            >
              Browse creators instead →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}