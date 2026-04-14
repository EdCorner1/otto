'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    proposed: 'bg-blue-50 text-blue-600',
    accepted: 'bg-green-100 text-green-700',
    in_progress: 'bg-[#ccff00]/20 text-[#363535]',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    disputed: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

type Deal = {
  id: string; status: string; budget: number | null; created_at: string
  jobs: { title: string }
  creators: { display_name: string; avatar_url?: string }
  brands: { company_name: string }
}

export default function DealsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{
    id: string; user_metadata?: { role?: string }
  } | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const userRole = user.user_metadata?.role
      setRole(userRole)

      if (userRole === 'brand') {
        const { data: brandData } = await supabase.from('brands').select('id').eq('user_id', user.id).single()
        if (!brandData) { setLoading(false); return }

        const { data } = await supabase
          .from('deals').select('*, jobs(title), creators(display_name, avatar_url)')
          .eq('brand_id', brandData.id)
          .order('created_at', { ascending: false })
        setDeals((data as Deal[]) || [])
      } else if (userRole === 'creator') {
        const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
        if (!creatorData) { setLoading(false); return }

        const { data } = await supabase
          .from('deals').select('*, jobs(title), brands(company_name)')
          .eq('creator_id', creatorData.id)
          .order('created_at', { ascending: false })
        setDeals((data as Deal[]) || [])
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isBrand = role === 'brand'
  const otherPartyLabel = isBrand ? 'Creator' : 'Brand'
  const otherPartyField = isBrand ? 'creators' : 'brands'
  const otherPartyNameField = isBrand ? 'display_name' : 'company_name'

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 style={{
          fontFamily: 'var(--font-bricolage)',
          fontWeight: 600,
          fontSize: 'clamp(28px, 5vw, 40px)',
          lineHeight: 1.0,
          letterSpacing: '-4.5px',
          color: '#363535',
        }}>
          My Deals
        </h1>
        <p className="text-sm text-[#6b6b6b] mt-2">
          {deals.length === 0 ? 'No active deals yet.' : `${deals.length} deal${deals.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-[#9a9a9a] mb-4">
            {isBrand ? 'Accept a proposal from a creator to start your first deal.' : 'Apply to briefs and get accepted to start earning.'}
          </p>
          <Link href="/jobs" className="btn-primary text-sm">
            {isBrand ? 'Browse briefs' : 'Find work'} →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => (
            <Link
              key={deal.id}
              href={`/messages/${deal.id}`}
              className="card card-hover flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isBrand && deal.creators?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={deal.creators.avatar_url}
                    alt={deal.creators.display_name}
                    className="w-10 h-10 rounded-full border border-[#e8e8e4] object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#363535] truncate">{deal.jobs?.title}</p>
                  <p className="text-xs text-[#9a9a9a] mt-0.5 truncate">
                    {deal[otherPartyField]?.[otherPartyNameField as keyof typeof deal[typeof otherPartyField]] || otherPartyLabel}
                    {deal.budget ? ` · £${deal.budget.toLocaleString()}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={deal.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}