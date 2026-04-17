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

export async function createNotification(admin: any, payload: NotificationPayload) {
  try {
    if (!payload.userId || !payload.type || !payload.content?.trim()) return

    await admin.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      content: payload.content.trim().slice(0, 500),
      link_url: payload.linkUrl?.trim() || null,
      read: false,
    })
  } catch (error) {
    console.error('createNotification error:', error)
  }
}
