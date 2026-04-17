'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// Emails that skip the onboarding check and can access owner-only surfaces
const OWNER_EMAILS = ['edcorner1@gmail.com']

type Role = 'creator' | 'brand'

type ProfileSummary = {
  name: string
  avatarUrl: string | null
}

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
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>({ name: 'User', avatarUrl: null })
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setUser(null)
          setRole(null)
          setLoading(false)
          router.replace('/login')
        }
        return
      }

      let resolvedRole: Role = (user.user_metadata?.role as Role) ?? null

      if (!resolvedRole) {
        const { data: userRow } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        resolvedRole = (userRow?.role as Role) ?? null
      }

      const [{ data: brandRow }, { data: creatorRow }] = await Promise.all([
        supabase.from('brands').select('id, company_name, logo_url').eq('user_id', user.id).maybeSingle(),
        supabase.from('creators').select('id, display_name, avatar_url').eq('user_id', user.id).maybeSingle(),
      ])

      if (!resolvedRole) {
        if (brandRow && !creatorRow) resolvedRole = 'brand'
        else if (creatorRow && !brandRow) resolvedRole = 'creator'
      }

      const onboardingComplete =
        OWNER_EMAILS.includes(user.email ?? '')
          ? true
          : resolvedRole === 'brand'
            ? !!brandRow
            : resolvedRole === 'creator'
              ? !!creatorRow
              : false

      if (cancelled) return

      const resolvedName = resolvedRole === 'brand'
        ? brandRow?.company_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        : creatorRow?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      const resolvedAvatar = resolvedRole === 'brand'
        ? brandRow?.logo_url || null
        : creatorRow?.avatar_url || null

      setUser(user)
      setRole(resolvedRole)
      setProfileSummary({ name: resolvedName, avatarUrl: resolvedAvatar })
      setLoading(false)

      if (!onboardingComplete && pathname !== '/onboarding') {
        router.replace('/onboarding')
        return
      }

      if (onboardingComplete && pathname === '/onboarding') {
        router.replace('/dashboard')
      }
    }

    bootstrap()

    return () => { cancelled = true }
  }, [pathname, router])

  // Close mobile menu on route change
  useEffect(() => { queueMicrotask(() => setMobileOpen(false)) }, [pathname])

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
  const isOwner = OWNER_EMAILS.includes(user.email ?? '')

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/jobs', label: isBrand ? 'My Briefs' : 'Find Work' },
    ...(isBrand ? [{ href: '/jobs/templates', label: 'Brief Templates' }] : []),
    { href: '/messages', label: 'Messages' },
    ...(isCreator ? [{ href: '/explore', label: 'Discover' }] : []),
    ...(isOwner ? [{ href: '/ops', label: 'Ops' }] : []),
  ]

  const isOnboardingRoute = pathname === '/onboarding'

  if (isOnboardingRoute) {
    return <div className="min-h-screen bg-[#fafaf9]">{children}</div>
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Nav */}
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex h-16 items-center justify-between px-5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>
            Otto
          </span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex h-full items-center gap-1 self-stretch">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`inline-flex h-full items-center rounded-xl px-4 text-sm font-medium transition-colors ${pathname === href ? 'text-[#363535]' : 'text-[#6b6b6b] hover:text-[#363535]'}`}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex h-full items-center">
          <div className="relative group h-full flex items-center">
            <button className="inline-flex h-11 items-center gap-3 rounded-2xl px-3 text-left transition-colors hover:bg-[#f7f7f5]">
              {profileSummary.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileSummary.avatarUrl} alt={profileSummary.name} className="h-9 w-9 rounded-full object-cover border border-[#e8e8e4]" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-white">
                  {profileSummary.name?.[0] ?? 'U'}
                </span>
              )}
              <span className="text-sm font-medium text-[#363535]">{profileSummary.name}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e8e8e4] rounded-xl shadow-lg shadow-black/[0.08] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <div className="px-4 py-3 border-b border-[#f0f0ec]">
                <p className="text-sm font-semibold text-[#363535] truncate">{profileSummary.name}</p>
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
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#e8e8e4] bg-white px-4 py-3">
            {profileSummary.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileSummary.avatarUrl} alt={profileSummary.name} className="h-10 w-10 rounded-full object-cover border border-[#e8e8e4]" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-white">
                {profileSummary.name?.[0] ?? 'U'}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#363535]">{profileSummary.name}</p>
              <p className="truncate text-xs text-[#9a9a9a]">{user.email}</p>
            </div>
          </div>
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
