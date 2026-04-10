'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const role = user?.user_metadata?.role || 'creator'
  const isCreator = role === 'creator'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold font-display tracking-tight">
            Otto<span className="inline-block w-2 h-2 bg-[#84cc16] rounded-full ml-0.5 mb-2" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user?.email}
            </span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold font-display tracking-tight mb-2">
            {isCreator ? 'Creator Dashboard' : 'Brand Dashboard'}
          </h1>
          <p className="text-gray-500">
            {isCreator
              ? 'Find your next tech UGC gig and manage your active deals.'
              : 'Post briefs, review proposals, and hire creators.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {isCreator ? (
            <>
              <Link href="/jobs" className="card flex items-start gap-4">
                <span className="text-2xl">🔍</span>
                <div>
                  <h3 className="font-semibold mb-1">Browse Jobs</h3>
                  <p className="text-sm text-gray-500">Find briefs that match your niche</p>
                </div>
              </Link>
              <Link href="/profile" className="card flex items-start gap-4">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="font-semibold mb-1">Edit Profile</h3>
                  <p className="text-sm text-gray-500">Update your portfolio and info</p>
                </div>
              </Link>
              <Link href="/dashboard" className="card flex items-start gap-4">
                <span className="text-2xl">💼</span>
                <div>
                  <h3 className="font-semibold mb-1">My Deals</h3>
                  <p className="text-sm text-gray-500">Track your active work</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/jobs/new" className="card flex items-start gap-4">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-semibold mb-1">Post a Job</h3>
                  <p className="text-sm text-gray-500">Create a new UGC brief</p>
                </div>
              </Link>
              <Link href="/jobs" className="card flex items-start gap-4">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-semibold mb-1">My Jobs</h3>
                  <p className="text-sm text-gray-500">Manage your open briefs</p>
                </div>
              </Link>
              <Link href="/dashboard" className="card flex items-start gap-4">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold mb-1">Browse Creators</h3>
                  <p className="text-sm text-gray-500">Discover tech UGC talent</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-xl font-bold font-display mb-2">You're on the list!</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Otto is launching soon. Complete your profile and you'll be ready to go when we open the doors.
          </p>
        </div>
      </div>
    </div>
  )
}
