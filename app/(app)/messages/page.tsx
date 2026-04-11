'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
  color: '#363535',
}

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

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function FloatingNav({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold font-display tracking-tight text-[#363535] hover:opacity-80 transition-opacity">
          Otto
          <span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Dashboard</Link>
          <span className="text-sm text-[#6b6b6b] hidden sm:block">{user?.email}</span>
          <button onClick={onSignOut} className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors">Sign out</button>
        </div>
      </div>
    </header>
  )
}

type Deal = {
  id: string
  amount: number
  status: string
  created_at: string
  job_id: string
  brand_id: string
  creator_id: string
  jobs: { title: string }
  brands: { company_name: string }
  creators: { display_name: string; user_id: string }
  last_message?: string
  last_message_at?: string
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const role = user.user_metadata?.role

      if (role === 'brand') {
        const { data: brandData } = await supabase.from('brands').select('id').eq('user_id', user.id).single()
        if (!brandData) { router.push('/dashboard'); return }

        const { data: dealsData } = await supabase
          .from('deals')
          .select('*, jobs(title), creators(display_name, user_id), brands(company_name)')
          .eq('brand_id', brandData.id)
          .order('created_at', { ascending: false })

        setDeals((dealsData as any[]) || [])
      } else if (role === 'creator') {
        const { data: creatorData } = await supabase.from('creators').select('id').eq('user_id', user.id).single()
        if (!creatorData) { router.push('/dashboard'); return }

        const { data: dealsData } = await supabase
          .from('deals')
          .select('*, jobs(title), creators(display_name, user_id), brands(company_name)')
          .eq('creator_id', creatorData.id)
          .order('created_at', { ascending: false })

        setDeals((dealsData as any[]) || [])
      }

      setLoading(false)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <FloatingNav user={user} onSignOut={handleSignOut} />

      <main className="pt-28 pb-20 max-w-2xl mx-auto px-6">
        <div className="mb-8 fade-up">
          <h1 style={headlineStyle}>Messages</h1>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="font-display text-xl font-semibold text-[#363535] mb-2">No conversations yet</h2>
            <p className="text-sm text-[#6b6b6b] mb-6">Apply to a brief to get started.</p>
            <Link href="/jobs" className="btn-primary">Browse Briefs</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal, i) => {
              const otherParty = user.user_metadata?.role === 'brand'
                ? deal.creators?.display_name || 'Creator'
                : deal.brands?.company_name || 'Brand'

              return (
                <Link
                  key={deal.id}
                  href={`/messages/${deal.id}`}
                  className={`card card-hover flex items-center gap-4 fade-up stagger-${Math.min(i + 1, 5)}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-[#363535] text-sm">{otherParty}</span>
                      <StatusBadge status={deal.status} />
                    </div>
                    <p className="text-sm font-medium text-[#363535] truncate">{deal.jobs?.title || 'Brief'}</p>
                    <p className="text-xs text-[#6b6b6b] truncate mt-0.5">
                      {deal.last_message || 'Start of conversation'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-[#363535]">£{deal.amount}</div>
                    <div className="text-xs text-[#9a9a9a] mt-0.5">{formatTime(deal.created_at)}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
