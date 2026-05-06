'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function HomeAuthCtas() {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setIsAuthed(!!data.user)
      setLoading(false)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center gap-5">
        <span className="text-sm text-[#9a9a9a] hidden sm:inline">Checking session…</span>
      </div>
    )
  }

  if (isAuthed) {
    return (
      <div className="flex items-center gap-5">
        <Link href="/dashboard" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Dashboard</Link>
        <Link href="/jobs" className="btn-primary text-sm py-2 px-5">Find Work</Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-5">
      <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
      <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
    </div>
  )
}
