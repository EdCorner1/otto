import type { Metadata } from 'next'
import { Bricolage_Grotesque, Open_Sans } from 'next/font/google'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://otto.edcorner.co.uk'),
  title: {
    default: 'Otto — UGC for tech brands and creators',
    template: '%s | Otto',
  },
  description: 'Otto connects tech brands with UGC creators who know their audience. Post briefs, find work, get paid. No audience minimums, no commission.',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://otto.edcorner.co.uk',
    siteName: 'Otto',
    title: 'Otto — UGC for tech brands and creators',
    description: 'Connect with UGC creators who understand your audience. Real work, fairly priced.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Otto — UGC for tech brands and creators',
    description: 'Connect with UGC creators who understand your audience. Real work, fairly priced.',
    creator: '@DefinitelyEd',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${openSans.variable}`}>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var observer = new IntersectionObserver(function(entries) {
                  entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                      entry.target.classList.add('is-visible');
                      observer.unobserve(entry.target);
                    }
                  });
                }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
                document.querySelectorAll('.fade-up').forEach(function(el) {
                  observer.observe(el);
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
