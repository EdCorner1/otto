export type NotificationType =
  | 'new_application'
  | 'application_accepted'
  | 'deal_update'
  | 'new_message'
  | 'payment_received'
  | 'review_requested'

type NotificationPayload = {
  userId: string
  type: NotificationType
  content: string
  linkUrl?: string | null
}

function isMissingRelationError(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.notifications'") ||
    message.includes('relation "public.notifications" does not exist') ||
    message.includes('relation "notifications" does not exist')
  )
}

export async function createNotification(admin: any, payload: NotificationPayload) {
  try {
    if (!payload.userId || !payload.type || !payload.content?.trim()) return

    const { error } = await admin.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      content: payload.content.trim().slice(0, 500),
      link_url: payload.linkUrl?.trim() || null,
      read: false,
    })

    if (error && !isMissingRelationError(error)) {
      console.error('createNotification error:', error)
    }
  } catch (error) {
    if (!isMissingRelationError(error)) {
      console.error('createNotification error:', error)
    }
  }
}
