'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Brand = {
  id: string
  company_name: string | null
  logo_url: string | null
  industry: string | null
}

type JobCountRow = {
  brand_id: string
}

export default function BrandDiscoveryPage() {
  const supabase = createClient()
  const [brands, setBrands] = useState<Brand[]>([])
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All')

  useEffect(() => {
    const load = async () => {
      const [{ data: brandsData }, { data: jobsData }] = await Promise.all([
        supabase
          .from('brands')
          .select('id, company_name, logo_url, industry')
          .order('company_name', { ascending: true }),
        supabase
          .from('jobs')
          .select('brand_id')
          .eq('status', 'open'),
      ])

      const counts: Record<string, number> = {}
      ;((jobsData as JobCountRow[]) || []).forEach((row) => {
        counts[row.brand_id] = (counts[row.brand_id] || 0) + 1
      })

      setBrands((brandsData as Brand[]) || [])
      setJobCounts(counts)
      setLoading(false)
    }

    load()
  }, [supabase])

  const industries = useMemo(() => {
    const unique = new Set<string>()
    brands.forEach((brand) => {
      if (brand.industry?.trim()) unique.add(brand.industry.trim())
    })
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [brands])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return brands.filter((brand) => {
      const companyName = (brand.company_name || '').toLowerCase()
      const matchesSearch = !query || companyName.includes(query)
      const matchesIndustry = industry === 'All' || brand.industry === industry
      return matchesSearch && matchesIndustry
    })
  }, [brands, industry, search])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-bricolage)',
            fontWeight: 600,
            fontSize: 'clamp(28px, 5vw, 40px)',
            lineHeight: 1,
            letterSpacing: '-0.5px',
            color: '#1c1c1e',
          }}
          className="mb-2"
        >
          Discover brands
        </h1>
        <p className="text-sm text-[#6b6b6b]">Browse active brands and jump into their live briefs.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] mb-5">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]">🔍</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by brand name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#1c1c1e] placeholder-[#9a9a9a] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
          />
        </div>

        <select
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          className="px-4 py-3 bg-white border border-[#e8e8e4] rounded-xl text-sm text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
        >
          {industries.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-sm text-[#6b6b6b]">No brands match your filters.</p>
          <button
            onClick={() => {
              setSearch('')
              setIndustry('All')
            }}
            className="mt-3 text-xs text-[#363535] underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              activeJobCount={jobCounts[brand.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BrandCard({ brand, activeJobCount }: { brand: Brand; activeJobCount: number }) {
  const displayName = brand.company_name || 'Unnamed brand'

  return (
    <div className="card card-hover p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {brand.logo_url ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e8e8e4] bg-white flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logo_url} alt={displayName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-[#f0f0ec] border border-dashed border-[#d0d0cc] flex items-center justify-center text-sm font-bold text-[#9a9a9a] flex-shrink-0">
            {displayName[0]?.toUpperCase() || '?'}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1c1c1e] truncate">{displayName}</p>
          <p className="text-xs text-[#6b6b6b] truncate">{brand.industry || 'Uncategorized'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#ccff00]/30 text-[#1c1c1e] font-semibold">
          {activeJobCount} active brief{activeJobCount !== 1 ? 's' : ''}
        </span>

        <Link href={`/brands/${brand.id}`} className="btn-ghost text-xs py-1.5 px-3">
          View briefs →
        </Link>
      </div>
    </div>
  )
}
