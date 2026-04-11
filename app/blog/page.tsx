import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'UGC insights, creator tactics, and brand playbooks. Written for tech creators who mean business.',
}

export { default } from './BlogListingClient'

export const dynamic = 'force-dynamic'
