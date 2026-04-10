'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const role = user?.user_metadata?.role || 'creator'
  const isCreator = role === 'creator'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold font-display tracking-tight">
              Otto<span className="inline-block w-2 h-2 bg-[#84cc16] rounded-full ml-0.5 mb-2" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {isCreator ? (
                <>
                  <Link href="/jobs" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Browse Jobs</Link>
                  <Link href="/profile" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Profile</Link>
                </>
              ) : (
                <>
                  <Link href="/jobs" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Jobs</Link>
                  <Link href="/creators" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Creators</Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 hidden sm:block">{user?.email}</div>
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
