'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Role = 'creator' | 'brand'

function HamburgerIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{
    id: string
    email?: string
    user_metadata?: { role?: Role; full_name?: string }
  } | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        setRole((data.user.user_metadata?.role as Role) ?? null)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return null

  const isCreator = role === 'creator'
  const isBrand = role === 'brand'

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/jobs', label: isBrand ? 'My Briefs' : 'Find Work' },
    ...(isBrand ? [{ href: '/jobs/templates', label: 'Brief Templates' }] : []),
    { href: '/messages', label: 'Messages' },
    ...(isCreator ? [{ href: '/creators', label: 'Discover' }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>
            Otto
          </span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`text-sm font-medium transition-colors ${pathname === href ? 'text-[#363535]' : 'text-[#6b6b6b] hover:text-[#363535]'}`}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-[#6b6b6b]">{user.email}</span>
          <div className="relative group">
            <button className="w-8 h-8 rounded-full bg-[#1c1c1e] text-white text-sm font-bold flex items-center justify-center cursor-pointer">
              {user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U'}
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e8e8e4] rounded-xl shadow-lg shadow-black/[0.08] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <div className="px-4 py-3 border-b border-[#f0f0ec]">
                <p className="text-sm font-semibold text-[#363535] truncate">{user.user_metadata?.full_name ?? 'User'}</p>
                <p className="text-xs text-[#9a9a9a] truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link href="/profile/edit" className="block px-4 py-2 text-sm text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors">Edit profile</Link>
                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors">Sign out</button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 rounded-xl text-[#363535] hover:bg-[#f0f0ec] transition-colors"
          aria-label="Toggle menu"
        >
          <HamburgerIcon open={mobileOpen} />
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col pt-24 px-6 bg-white/95 backdrop-blur-md md:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 p-2 text-[#363535]"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`py-4 text-base font-medium text-[#363535] border-b border-[#f0f0ec] ${pathname === href ? 'text-[#1c1c1e] font-semibold' : ''}`}>
                {label}
              </Link>
            ))}
            <Link href="/profile/edit" onClick={() => setMobileOpen(false)}
              className="py-4 text-base font-medium text-[#6b6b6b] border-b border-[#f0f0ec]">
              Edit profile
            </Link>
            <button onClick={handleSignOut}
              className="py-4 text-base font-medium text-[#6b6b6b] text-left mt-2">
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Page content */}
      <main className="pt-28 pb-20">{children}</main>
    </div>
  )
}
