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

type Role = 'brand' | 'creator' | null

// Placeholder data — from DB in future
const BRAND_BRIEFS = [
  {
    id: 1,
    title: 'AI Writing Tool Demo',
    status: 'open',
    proposals: 7,
    posted: '2 days ago',
  },
  {
    id: 2,
    title: 'SaaS Platform Overview',
    status: 'filled',
    proposals: 14,
    posted: '1 week ago',
  },
  {
    id: 3,
    title: 'Gadget Unboxing Series',
    status: 'open',
    proposals: 3,
    posted: '3 days ago',
  },
]

const CREATOR_PROPOSALS = [
  {
    id: 1,
    briefTitle: 'AI Writing Tool Demo',
    brand: 'WriteCraft',
    status: 'pending',
    date: '2 days ago',
  },
  {
    id: 2,
    briefTitle: 'SaaS Platform Overview',
    brand: 'FlowStack',
    status: 'accepted',
    date: '1 week ago',
  },
  {
    id: 3,
    briefTitle: 'Gadget Unboxing Series',
    brand: 'TechGear',
    status: 'rejected',
    date: '3 days ago',
  },
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-[#ccff00]/20 text-[#363535]',
    filled: 'bg-[#e8e8e4] text-[#6b6b6b]',
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-50 text-red-600',
  }
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'
        }`}
    >
      {status}
    </span>
  )
}

function FloatingNav({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold font-display tracking-tight text-[#363535] hover:opacity-80 transition-opacity"
        >
          Otto
          <span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6b6b6b] hidden sm:block">{user?.email}</span>
          <button
            onClick={onSignOut}
            className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setRole(user.user_metadata?.role || null)
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

  const displayName =
    role === 'creator'
      ? user?.user_metadata?.display_name || user?.email
      : user?.email

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <FloatingNav user={user} onSignOut={handleSignOut} />

      <main className="pt-28 pb-20 max-w-6xl mx-auto px-6">
        {/* Welcome header */}
        <div className="mb-10 fade-up">
          <h1 style={headlineStyle}>Welcome back, {displayName}.</h1>
        </div>

        {/* Stats row — from DB in future */}
        <div className="grid grid-cols-3 gap-4 mb-10 fade-up stagger-1">
          {role === 'brand' ? (
            <>
              <div className="card text-center">
                <div className="text-2xl font-bold font-display text-[#363535]">3</div>
                <div className="section-label mt-1">Active Briefs</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold font-display text-[#363535]">12</div>
                <div className="section-label mt-1">Proposals</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold font-display text-[#363535]">2</div>
                <div className="section-label mt-1">Creators Hired</div>
              </div>
            </>
          ) : (
            <>
              <div className="card text-center">
                <div className="text-2xl font-bold font-display text-[#363535]">4</div>
                <div className="section-label mt-1">Active Proposals</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold font-display text-[#363535]">2</div>
                <div className="section-label mt-1">Deals in Progress</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold font-display text-[#363535]">£450</div>
                <div className="section-label mt-1">Earned</div>
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mb-10 fade-up stagger-2">
          {role === 'brand' ? (
            <Link href="/briefs/new" className="btn-primary">
              Post a New Brief
            </Link>
          ) : (
            <Link href="/briefs" className="btn-primary">
              Browse Briefs
            </Link>
          )}
        </div>

        {/* Cards section */}
        {role === 'brand' ? (
          <div className="fade-up stagger-3">
            <p className="section-label mb-4">Your Briefs</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BRAND_BRIEFS.map((brief) => (
                <div key={brief.id} className="card card-hover space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-[#363535] pr-2">{brief.title}</h3>
                    <StatusBadge status={brief.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#6b6b6b]">
                    <span>{brief.proposals} proposals</span>
                    <span>·</span>
                    <span>{brief.posted}</span>
                  </div>
                  <Link
                    href={`/briefs/${brief.id}`}
                    className="btn-ghost text-sm py-2 px-3 w-fit"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-up stagger-3">
            <p className="section-label mb-4">Your Proposals</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CREATOR_PROPOSALS.map((proposal) => (
                <div key={proposal.id} className="card card-hover space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-[#363535] pr-2">{proposal.briefTitle}</h3>
                    <StatusBadge status={proposal.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
                    <span>{proposal.brand}</span>
                    <span>·</span>
                    <span>{proposal.date}</span>
                  </div>
                  <Link
                    href={`/proposals/${proposal.id}`}
                    className="btn-ghost text-sm py-2 px-3 w-fit"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
