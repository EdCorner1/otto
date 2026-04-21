'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const OWNER_EMAILS = ['edcorner1@gmail.com']
const SIDEBAR_ORDER_KEY = 'otto:sidebar:order'
const SIDEBAR_COLLAPSED_KEY = 'otto:sidebar:collapsed'
const DEFAULT_ORDER = ['dashboard', 'messages', 'notifications', 'portfolio', 'live-campaigns', 'payments', 'affiliates']

type Role = 'creator' | 'brand'

type ProfileSummary = {
  name: string
  avatarUrl: string | null
}

type NavItem = {
  key: string
  label: string
  href?: string
  icon: React.ReactNode
  iconOnly?: React.ReactNode
  comingSoon?: boolean
  activePrefixes?: string[]
  badgeCount?: number
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

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="4" rx="1.5" />
      <rect x="14" y="10" width="7" height="11" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  )
}

function PortfolioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 13h6" />
    </svg>
  )
}

function CampaignIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15V6a2 2 0 0 0-2-2H8l-5 5v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
      <path d="M17 3v6h6" />
    </svg>
  )
}

function PaymentsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M7 15h2" />
    </svg>
  )
}

function AffiliateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 7h3a5 5 0 0 1 0 10h-3" />
      <path d="M9 17H6A5 5 0 0 1 6 7h3" />
      <path d="M8 12h8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing">
      <circle cx="4.5" cy="4" r="1.2" fill="currentColor" />
      <circle cx="9.5" cy="4" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="9.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="9.5" cy="10" r="1.2" fill="currentColor" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  )
}

function isActive(pathname: string, item: NavItem) {
  if (!item.href) return false
  const prefixes = item.activePrefixes?.length ? item.activePrefixes : [item.href]
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function SortableNavItem({
  item,
  collapsed,
  pathname,
  onToggleCollapse,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
  onToggleCollapse?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  }

  const active = isActive(pathname, item)

  const classes = `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
    active
      ? 'bg-[#f7fbe7] text-[#363535] border border-[#e2efad]'
      : item.comingSoon
        ? 'text-[#9a9a9a] bg-[#fbfbfa] border border-transparent'
        : 'text-[#6b6b6b] hover:bg-[#f7f7f5] hover:text-[#363535]'
  }`

  const inner = (
    <>
      <span className={active ? 'text-[#363535]' : 'text-current'}>{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 font-medium truncate">{item.label}</span>
          {item.comingSoon && (
            <span className="rounded-full bg-[#f0f0ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9a9a] shrink-0">Soon</span>
          )}
          {!item.comingSoon && item.badgeCount && item.badgeCount > 0 && (
            <span className="rounded-full bg-[#ccff00] px-2 py-0.5 text-[10px] font-semibold text-[#1c1c1e] shrink-0">
              {item.badgeCount > 99 ? '99+' : item.badgeCount}
            </span>
          )}
        </>
      )}
    </>
  )

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {!collapsed && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 mr-1 rounded-lg text-[#c0c0ba] hover:text-[#6b6b6b] hover:bg-[#f0f0ec] transition-all cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ccff00]"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <GripIcon />
        </button>
      )}
      {item.href && !item.comingSoon ? (
        <Link href={item.href} className={classes + (collapsed ? ' px-3 py-3' : ' flex-1 min-w-0')}>
          {inner}
        </Link>
      ) : (
        <div className={classes + (collapsed ? ' px-3 py-3' : ' flex-1 min-w-0')}>
          {inner}
        </div>
      )}
    </div>
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [itemOrder, setItemOrder] = useState<string[]>(DEFAULT_ORDER)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Load persisted sidebar state
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(SIDEBAR_ORDER_KEY)
      if (savedOrder) setItemOrder(JSON.parse(savedOrder))
    } catch {}
    try {
      const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (savedCollapsed) setCollapsed(savedCollapsed === 'true')
    } catch {}
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItemOrder((items) => {
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      const next = arrayMove(items, oldIndex, newIndex)
      try { localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

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

      const { data: userRow } = await supabase
        .from('users')
        .select('role, onboarding_complete')
        .eq('id', user.id)
        .maybeSingle()

      if (!resolvedRole) {
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

      const isOwner = OWNER_EMAILS.includes((user.email ?? '').toLowerCase())
      const onboardingComplete =
        isOwner
          ? true
          : Boolean(userRow?.onboarding_complete || user.user_metadata?.onboarding_complete)

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

      if (onboardingComplete && pathname === '/onboarding' && !isOwner) {
        router.replace('/dashboard')
      }
    }

    bootstrap()

    return () => { cancelled = true }
  }, [pathname, router, supabase])

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false))
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    const response = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!response.ok) return

    const data = await response.json()
    const notifications = Array.isArray(data.notifications) ? data.notifications : []
    setUnreadCount(notifications.filter((item: { read?: boolean }) => !item.read).length)
  }, [supabase, user])

  useEffect(() => {
    if (!user) return

    const initialTimeout = setTimeout(() => {
      fetchUnreadCount()
    }, 0)
    const intervalId = setInterval(fetchUnreadCount, 30000)

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [fetchUnreadCount, pathname, supabase, user])

  const baseNavItems = useMemo<NavItem[]>(() => [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon />, activePrefixes: ['/dashboard'] },
    { key: 'messages', label: 'Messages', href: '/messages', icon: <MessageIcon /> },
    { key: 'notifications', label: 'Notifications', href: '/notifications', icon: <BellIcon />, badgeCount: unreadCount, activePrefixes: ['/notifications'] },
    {
      key: 'portfolio',
      label: role === 'brand' ? 'Brand Profile' : 'Portfolio',
      href: role === 'brand' ? '/profile/edit' : '/portfolio',
      icon: <PortfolioIcon />,
      activePrefixes: role === 'brand' ? ['/profile/edit'] : ['/portfolio'],
    },
    { key: 'live-campaigns', label: 'Live Campaigns', href: '/live-campaigns', icon: <CampaignIcon />, activePrefixes: ['/live-campaigns'] },
    { key: 'payments', label: 'Payments', icon: <PaymentsIcon />, comingSoon: true },
    { key: 'affiliates', label: 'Affiliates', icon: <AffiliateIcon />, comingSoon: true },
  ], [role, unreadCount])

  const orderedNavItems = useMemo(() => {
    return itemOrder
      .filter((key) => {
        if (key === 'payments' || key === 'affiliates') return true
        if (key === 'portfolio') return true
        if (key === 'dashboard' || key === 'messages' || key === 'notifications' || key === 'live-campaigns') return true
        return true
      })
      .map((key) => baseNavItems.find((item) => item.key === key))
      .filter(Boolean) as NavItem[]
  }, [itemOrder, baseNavItems])

  const quickLinks = useMemo(() => [
    { href: '/profile/edit', label: 'Edit profile' },
    ...(OWNER_EMAILS.includes(user?.email ?? '') ? [{ href: '/ops', label: 'Ops dashboard' }] : []),
  ], [user?.email])

  const isOnboardingRoute = pathname === '/onboarding'
  const isPublicPortfolioRoute = !!pathname && /^\/[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(pathname) && !['/dashboard', '/messages', '/notifications', '/profile', '/portfolio', '/jobs', '/live-campaigns', '/search', '/settings', '/explore', '/creators', '/brands', '/blog', '/resources', '/platform', '/login', '/signup', '/onboarding', '/ops', '/ed', '/auth', '/api'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (isPublicPortfolioRoute) {
    return <div className="min-h-screen bg-[#fafaf9]">{children}</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-8 h-8 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  if (isOnboardingRoute) {
    return <div className="min-h-screen bg-[#fafaf9]">{children}</div>
  }

  const currentSection = baseNavItems.find((item) => isActive(pathname, item))?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex h-16 items-center justify-between px-5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl text-[#363535] hover:bg-[#f0f0ec] transition-colors"
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '20px', letterSpacing: '-1px', color: '#363535' }}>
              Otto
            </span>
            <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
          </Link>

          <div className="hidden md:block h-7 w-px bg-[#ecece8]" />
          <p className="hidden md:block text-sm font-medium text-[#6b6b6b] truncate">{currentSection}</p>
        </div>

        <div className="flex h-full items-center gap-2">
          <Link
            href="/search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ecece8] text-[#6b6b6b] transition-colors hover:bg-[#f7f7f5] hover:text-[#1c1c1e]"
            aria-label="Open search"
          >
            <SearchIcon />
          </Link>

          <Link href="/notifications" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[#363535] transition-colors hover:bg-[#f7f7f5]" aria-label="Notifications">
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[#ccff00] text-[11px] font-bold text-[#1c1c1e] flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

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
              <span className="hidden sm:block text-sm font-medium text-[#363535] max-w-[160px] truncate">{profileSummary.name}</span>
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
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-8 z-40 flex-col rounded-[28px] border border-[#e8e8e4] bg-white/90 backdrop-blur-md shadow-lg shadow-black/[0.04] transition-all duration-300 ${
          collapsed ? 'top-24 bottom-6 w-[72px]' : 'top-24 bottom-6 w-[264px]'
        }`}
      >
        <div className={`px-5 pt-5 pb-4 border-b border-[#f3f3ef] ${collapsed ? 'px-3 pb-3 pt-3' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {profileSummary.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileSummary.avatarUrl} alt={profileSummary.name} className="h-11 w-11 rounded-full object-cover border border-[#e8e8e4]" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-white">
                {profileSummary.name?.[0] ?? 'U'}
              </span>
            )}
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#363535]">{profileSummary.name}</p>
                <p className="truncate text-xs text-[#9a9a9a]">{role === 'brand' ? 'Brand account' : 'Creator account'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav items with drag-to-reorder */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemOrder} strategy={verticalListSortingStrategy}>
            <nav className={`flex-1 px-4 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2 py-3' : ''}`}>
              {orderedNavItems.map((item) => (
                <SortableNavItem
                  key={item.key}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
            </nav>
          </SortableContext>
        </DndContext>

        {/* Sidebar footer — collapse toggle + quick links */}
        <div className={`px-4 pb-4 space-y-2 border-t border-[#f3f3ef] ${collapsed ? 'px-2 pt-3 pb-3' : 'pt-3'}`}>
          {!collapsed && quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-2xl border border-[#f0f0ec] px-4 py-3 text-sm text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors">
              <span>{link.label}</span>
              <span>→</span>
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className={`w-full rounded-2xl border border-[#f0f0ec] text-left text-sm text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors ${collapsed ? 'px-3 py-3 text-center' : 'px-4 py-3'}`}
          >
            {collapsed ? (
              <span className="inline-flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3" />
                  <path d="M11 11l4-4-4-4M15 7H6" />
                </svg>
              </span>
            ) : (
              'Sign out'
            )}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className={`w-full flex items-center gap-2 rounded-2xl border border-[#f0f0ec] px-4 py-3 text-sm font-medium text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors ${collapsed ? 'justify-center px-3' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar to icons'}
          >
            {collapsed ? <ExpandIcon /> : <><CollapseIcon /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#1c1c1e]/30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-4 top-20 bottom-4 w-[calc(100%-2rem)] max-w-sm rounded-[28px] border border-[#e8e8e4] bg-white p-5 shadow-xl shadow-black/[0.08]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {profileSummary.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileSummary.avatarUrl} alt={profileSummary.name} className="h-11 w-11 rounded-full object-cover border border-[#e8e8e4]" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-white">
                    {profileSummary.name?.[0] ?? 'U'}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#363535]">{profileSummary.name}</p>
                  <p className="truncate text-xs text-[#9a9a9a]">{role === 'brand' ? 'Brand account' : 'Creator account'}</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-[#363535] hover:bg-[#f0f0ec]" aria-label="Close menu">
                <HamburgerIcon open />
              </button>
            </div>

            <nav className="space-y-2">
              {orderedNavItems.map((item) => {
                const active = isActive(pathname, item)
                const classes = `flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${active ? 'bg-[#f7fbe7] text-[#363535] border border-[#e2efad]' : item.comingSoon ? 'text-[#9a9a9a] bg-[#fbfbfa] border border-transparent' : 'text-[#6b6b6b] hover:bg-[#f7f7f5] hover:text-[#363535]'}`
                const inner = (
                  <>
                    <span className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </span>
                    {item.comingSoon && (
                      <span className="rounded-full bg-[#f0f0ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9a9a]">Soon</span>
                    )}
                    {!item.comingSoon && item.badgeCount && item.badgeCount > 0 && (
                      <span className="rounded-full bg-[#ccff00] px-2 py-0.5 text-[10px] font-semibold text-[#1c1c1e]">
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </span>
                    )}
                  </>
                )

                if (item.href && !item.comingSoon) {
                  return (
                    <Link key={item.key} href={item.href} onClick={() => setMobileOpen(false)} className={classes}>
                      {inner}
                    </Link>
                  )
                }

                return (
                  <div key={item.key} className={classes}>
                    {inner}
                  </div>
                )
              })}
            </nav>

            <div className="mt-6 space-y-2">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-2xl border border-[#f0f0ec] px-4 py-3 text-sm text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors">
                  <span>{link.label}</span>
                  <span>→</span>
                </Link>
              ))}
              <button onClick={handleSignOut} className="w-full rounded-2xl border border-[#f0f0ec] px-4 py-3 text-left text-sm text-[#6b6b6b] hover:bg-[#fafaf9] hover:text-[#363535] transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-28 pb-20 md:pl-[304px] transition-all duration-300">
        <div className="px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
