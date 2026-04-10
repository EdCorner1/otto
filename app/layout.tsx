import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Otto — The UGC Marketplace for Tech Brands & Creators',
  description: 'Otto connects forward-thinking tech brands with vetted UGC creators. Faster briefs. Better matches. Real results.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
