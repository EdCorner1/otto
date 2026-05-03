export const DEFAULT_OWNER_EMAILS: string[] = []

export type AuthLikeUser = {
  id: string
  email?: string | null
  user_metadata?: {
    role?: string
    is_admin?: boolean
    admin?: boolean
  }
}

export function isOwnerUser(user: AuthLikeUser | null | undefined) {
  if (!user) return false
  const email = (user.email || '').toLowerCase().trim()
  const isOwnerEmail = DEFAULT_OWNER_EMAILS.includes(email)
  const isAdminFlag = Boolean(user.user_metadata?.is_admin || user.user_metadata?.admin)
  const isAdminRole = user.user_metadata?.role === 'admin'
  return isOwnerEmail || isAdminFlag || isAdminRole
}
