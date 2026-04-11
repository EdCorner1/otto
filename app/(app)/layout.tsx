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
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Floating nav */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#e8e8e4]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + home link */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold font-display tracking-tight text-[#363535] hover:opacity-80 transition-opacity"
          >
            Otto
            <span className="inline-block w-2 h-2 bg-[#ccff00] rounded-full mb-2" />
          </Link>

          {/* Right side: email + sign out */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6b6b6b] hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-[#6b6b6b] hover:text-[#363535] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 pb-20 max-w-6xl mx-auto px-6">{children}</main>
    </div>
  )
}
