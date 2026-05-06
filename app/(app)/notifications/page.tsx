'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  MessageCircle,
  RefreshCcw,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

type NotificationType =
  | 'new_application'
  | 'application_accepted'
  | 'deal_update'
  | 'new_message'
  | 'payment_received'
  | 'review_requested'

type NotificationRow = {
  id: string
  type: NotificationType
  content: string
  read: boolean
  created_at: string
  link_url: string | null
}

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-bricolage)',
  fontWeight: 600,
  fontSize: 'clamp(28px, 5vw, 40px)',
  lineHeight: 1.0,
  letterSpacing: '-4.5px',
  color: '#1c1c1e',
}

function formatRelativeTime(dateString: string) {
  const then = new Date(dateString).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const sec = Math.floor(diff / 1000)

  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function typeIcon(type: NotificationType) {
  switch (type) {
    case 'new_application':
      return <Briefcase size={16} className="text-[#1c1c1e]" />
    case 'application_accepted':
      return <CheckCircle2 size={16} className="text-[#1c1c1e]" />
    case 'deal_update':
      return <RefreshCcw size={16} className="text-[#1c1c1e]" />
    case 'new_message':
      return <MessageCircle size={16} className="text-[#1c1c1e]" />
    case 'payment_received':
      return <CircleDollarSign size={16} className="text-[#1c1c1e]" />
    case 'review_requested':
      return <Sparkles size={16} className="text-[#1c1c1e]" />
    default:
      return <Bell size={16} className="text-[#1c1c1e]" />
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      router.push('/login')
      return
    }

    const res = await fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      setNotifications([])
      setLoading(false)
      return
    }

    const data = await res.json()
    setNotifications((data.notifications || []) as NotificationRow[])
    setLoading(false)
  }, [router, supabase])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const markOneAsRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id)
    if (!target) return

    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    })

    if (target.link_url) {
      router.push(target.link_url)
    }
  }

  const markAllAsRead = async () => {
    if (!notifications.length) return

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ all: true }),
    })
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
      <main className="pt-28 pb-20 max-w-3xl mx-auto px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 style={headlineStyle}>Notifications</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <button
            onClick={markAllAsRead}
            className="rounded-xl border border-[#e8e8e4] bg-white px-4 py-2 text-sm font-medium text-[#1c1c1e] hover:bg-[#f7f7f5] transition-colors"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-[#e8e8e4] bg-white p-10 text-center">
            <Bell size={28} className="mx-auto text-[#ccff00]" />
            <h2 className="mt-3 text-lg font-semibold text-[#1c1c1e]">No notifications yet</h2>
            <p className="mt-1 text-sm text-[#6b6b6b]">When activity happens, it’ll show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <button
                key={item.id}
                onClick={() => markOneAsRead(item.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                  item.read
                    ? 'border-[#e8e8e4] bg-white'
                    : 'border-[#ddeb9a] bg-[#f9fde9]'
                } hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ccff00]">
                    {typeIcon(item.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1c1c1e] leading-relaxed">{item.content}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#6b6b6b]">
                      <span>{formatRelativeTime(item.created_at)}</span>
                      {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-[#ccff00]" />}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
