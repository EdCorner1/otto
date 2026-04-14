import Link from 'next/link'
import Image from 'next/image'
import { FileText, Book, ClipboardList, Wrench } from 'lucide-react'

export const metadata = {
  title: 'Resources — Otto UGC',
  description: 'Free resources for tech UGC creators. Guides, templates, tools, and insights to build your creator business.',
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-6 h-6" />,
  Book: <Book className="w-6 h-6" />,
  ClipboardList: <ClipboardList className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
}
function IconMap({ name }: { name: string }) {
  return ICON_MAP[name] ?? <FileText className="w-6 h-6" />
}

type ResourceItem = { title: string; status: string }
type ResourceSection = {
  category: string
  description: string
  icon: string
  href: string | null
  cta: string | null
  coming: boolean
  items: ResourceItem[] | null
}

const resources: ResourceSection[] = [
  {
    category: 'Blog',
    description: 'Practical insights on tech UGC — pricing, pitching, brand deals, and building a creator business.',
    icon: 'FileText',
    href: '/blog',
    cta: 'Read the blog',
    coming: false,
    items: null,
  },
  {
    category: 'Guides',
    description: 'In-depth guides for every stage of the creator journey.',
    icon: 'Book',
    href: null,
    cta: null,
    coming: true,
    items: [
      { title: 'How to Price Your UGC Work', status: 'Coming soon' },
      { title: 'The Creator Pitching Playbook', status: 'Coming soon' },
      { title: 'Building a Brand Deal Pipeline', status: 'Coming soon' },
      { title: 'Your First 30 Days on Otto', status: 'Coming soon' },
    ],
  },
  {
    category: 'Templates',
    description: 'Copy-and-paste templates that close deals.',
    icon: 'ClipboardList',
    href: null,
    cta: null,
    coming: true,
    items: [
      { title: 'UGC Proposal Template', status: 'Coming soon' },
      { title: 'Brand Deal Contract', status: 'Coming soon' },
      { title: 'Invoice Template', status: 'Coming soon' },
      { title: 'Creator Brief Template', status: 'Coming soon' },
    ],
  },
  {
    category: 'Tools',
    description: 'The exact tools that actually work for tech UGC creators.',
    icon: 'Wrench',
    href: null,
    cta: null,
    coming: true,
    items: [
      { title: 'Video Editing', status: 'Coming soon' },
      { title: 'Audio & Lighting', status: 'Coming soon' },
      { title: 'Analytics & Scheduling', status: 'Coming soon' },
      { title: 'Prospecting & Outreach', status: 'Coming soon' },
    ],
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Nav */}
      <nav className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border border-[#e8e8e4] rounded-2xl shadow-lg shadow-black/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-tight" style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}>Otto</span>
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-5">
          
          <Link href="/resources" className="text-sm font-medium text-[#363535] transition-colors">Resources</Link>
          <Link href="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:inline-flex">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#ccff00] mb-3">Resources</p>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1.0, letterSpacing: '-4px', color: '#363535' }} className="mb-4">
            Built for creators who mean business.
          </h1>
          <p className="text-[#6b6b6b] text-lg max-w-xl leading-relaxed">
            No recycled tips. No generic advice. Just real resources from creators who have done the deals and built the audience.
          </p>
        </div>

        {/* Resource sections */}
        <div className="space-y-5 mb-16">
          {resources.map((section) => (
            <div key={section.category} className="bg-white border border-[#e8e8e4] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-[#ccff00]"><IconMap name={section.icon} /></span>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h2 style={{ fontSize: '22px', letterSpacing: '-1.5px', color: '#363535' }}>
                      {section.category}
                    </h2>
                    {section.href && !section.coming && (
                      <Link href={section.href} className="btn-primary text-sm py-2 px-4">
                        {section.cta}
                      </Link>
                    )}
                    {section.coming && (
                      <span className="text-xs font-semibold bg-[#f0f0ec] text-[#9a9a9a] px-3 py-1 rounded-full">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6b6b6b] mt-1">{section.description}</p>
                </div>
              </div>

              {/* Items list */}
              {section.items && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {section.items.map((item) => (
                    <div key={item.title} className="flex items-center justify-between px-4 py-3 bg-[#fafaf9] rounded-xl">
                      <span className="text-sm text-[#363535]">{item.title}</span>
                      <span className="text-xs text-[#9a9a9a]">{item.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-[#363535] rounded-2xl p-8 text-center">
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', letterSpacing: '-2px', color: '#ffffff' }} className="mb-3">
            Want access to everything?
          </h2>
          <p className="text-white/60 text-sm mb-6">Create your Otto account to access resources as they drop.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ccff00] text-[#1c1c1c] rounded-xl text-sm font-bold hover:bg-[#d9ff4d] transition-colors">
            Create your account →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-[#e8e8e4]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-extrabold font-display tracking-tight text-[#1c1c1c]">Otto</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
            </Link>
            <div className="flex items-center gap-5 text-xs text-[#9a9a9a]">
              
              <Link href="/about" className="hover:text-[#1c1c1c] transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-[#1c1c1c] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#1c1c1c] transition-colors">Terms</Link>
            </div>
            <p className="text-xs text-[#9a9a9a]">© 2026 Otto</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
