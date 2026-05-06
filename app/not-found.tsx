import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] px-5 py-10 text-[#363535]" style={{ fontFamily: 'var(--font-open-sans)' }}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8b8b84]">404 — page not found</p>
        <h1 className="mt-4 text-[clamp(3.2rem,10vw,7rem)] leading-[0.86] text-[#111111]" style={{ fontFamily: 'var(--font-bricolage)', letterSpacing: '-0.075em' }}>
          Never gonna find this page.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#66665f] sm:text-lg">
          The link is broken, the route is gone, and yes — you are being professionally Rickrolled.
        </p>

        <div className="mt-8 w-full max-w-3xl overflow-hidden rounded-[14px] border border-[#dfdfd7] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <div className="aspect-video w-full">
            <iframe
              title="Rick Astley - Never Gonna Give You Up"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center justify-center rounded-full bg-[#ccff00] px-6 py-3 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#d8ff47]">
            Go back home
          </Link>
          <Link href="/creators" className="inline-flex items-center justify-center rounded-full border border-[#deded8] bg-white px-6 py-3 text-sm font-semibold text-[#363535] transition hover:border-[#ccff00]">
            Browse creators
          </Link>
        </div>
      </div>
    </main>
  )
}
