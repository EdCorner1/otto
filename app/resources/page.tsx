import Link from 'next/link'
import {
  ArrowRight,
  Book,
  CheckCircle2,
  ClipboardList,
  FileText,
  Sparkles,
  Wrench,
} from 'lucide-react'

export const metadata = {
  title: 'Resources — Otto UGC',
  description:
    'Practical resources for tech UGC creators — guides, templates, tools, and playbooks that help you win better deals.',
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-5 w-5" />,
  Book: <Book className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
}

function IconMap({ name }: { name: string }) {
  return ICON_MAP[name] ?? <FileText className="h-5 w-5" />
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
    description:
      'Practical breakdowns on pricing, pitching, brand deals, and building a serious creator business.',
    icon: 'FileText',
    href: '/blog',
    cta: 'Read articles',
    coming: false,
    items: null,
  },
  {
    category: 'Guides',
    description: 'Deep, step-by-step playbooks for each stage of your growth.',
    icon: 'Book',
    href: null,
    cta: null,
    coming: true,
    items: [
      { title: 'How to price your UGC work', status: 'Coming soon' },
      { title: 'The creator pitching playbook', status: 'Coming soon' },
      { title: 'Building a brand deal pipeline', status: 'Coming soon' },
      { title: 'Your first 30 days on Otto', status: 'Coming soon' },
    ],
  },
  {
    category: 'Templates',
    description: 'Reusable assets to help you move faster and close cleaner.',
    icon: 'ClipboardList',
    href: null,
    cta: null,
    coming: true,
    items: [
      { title: 'UGC proposal template', status: 'Coming soon' },
      { title: 'Brand deal contract', status: 'Coming soon' },
      { title: 'Invoice template', status: 'Coming soon' },
      { title: 'Creator brief template', status: 'Coming soon' },
    ],
  },
  {
    category: 'Tools',
    description: 'Recommended creator stack for production, workflow, and outreach.',
    icon: 'Wrench',
    href: null,
    cta: null,
    coming: true,
    items: [
      { title: 'Video editing stack', status: 'Coming soon' },
      { title: 'Audio and lighting setup', status: 'Coming soon' },
      { title: 'Analytics and scheduling', status: 'Coming soon' },
      { title: 'Prospecting and outreach', status: 'Coming soon' },
    ],
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <nav className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between rounded-2xl border border-[#e8e8e4] bg-white/80 px-5 py-3.5 shadow-lg shadow-black/[0.06] backdrop-blur-md md:left-8 md:right-8">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-lg font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-bricolage)', color: '#363535' }}
          >
            Otto
          </span>
          <span className="h-2 w-2 rounded-full bg-[#ccff00] animate-pulse" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/resources" className="text-sm font-medium text-[#363535] transition-colors">
            Resources
          </Link>
          <Link href="/login" className="btn-ghost hidden px-4 py-2 text-sm sm:inline-flex">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary px-5 py-2 text-sm">
            Get started
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-32">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e8e8e4] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            <Sparkles className="h-3.5 w-3.5 text-[#8fb600]" />
            Creator resources
          </div>
          <h1
            className="mb-4"
            style={{ fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1.0, letterSpacing: '-0.05em', color: '#1c1c1e' }}
          >
            Practical playbooks for creators building real momentum.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-[#6b6b6b]">
            Clear systems, cleaner workflows, and better deal outcomes. Built for tech creators who want useful guidance, not recycled advice.
          </p>
        </header>

        <section className="mb-16 space-y-5">
          {resources.map((section) => (
            <article
              key={section.category}
              className="rounded-2xl border border-[#e8e8e4] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start gap-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f2] text-[#1c1c1e]">
                  <IconMap name={section.icon} />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2
                      className="text-[#1c1c1e]"
                      style={{ fontSize: '22px', letterSpacing: '-0.03em', fontFamily: 'var(--font-bricolage)' }}
                    >
                      {section.category}
                    </h2>
                    {section.href && !section.coming && (
                      <Link href={section.href} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
                        {section.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    {section.coming && (
                      <span className="rounded-full bg-[#f0f0ec] px-3 py-1 text-xs font-semibold text-[#7a7a75]">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#6b6b6b]">{section.description}</p>
                </div>
              </div>

              {section.items && (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-xl bg-[#fafaf9] px-4 py-3"
                    >
                      <span className="text-sm text-[#363535]">{item.title}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#8a8a86]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-[#1c1c1e] p-8 text-center">
          <h2
            className="mb-3 text-white"
            style={{ fontSize: 'clamp(22px, 4vw, 32px)', letterSpacing: '-0.04em', fontFamily: 'var(--font-bricolage)' }}
          >
            Want first access to new drops?
          </h2>
          <p className="mb-6 text-sm text-white/65">
            Join the Otto waitlist and get updates when new resources go live.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#ccff00] px-6 py-3 text-sm font-bold text-[#1c1c1c] transition-colors hover:bg-[#d9ff4d]"
          >
            Join now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <footer className="mt-16 border-t border-[#e8e8e4] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#1c1c1c]">Otto</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ccff00]" />
            </Link>
            <div className="flex items-center gap-5 text-xs text-[#9a9a9a]">
              <Link href="/about" className="transition-colors hover:text-[#1c1c1c]">
                About
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-[#1c1c1c]">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[#1c1c1c]">
                Terms
              </Link>
            </div>
            <p className="text-xs text-[#9a9a9a]">© 2026 Otto</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
