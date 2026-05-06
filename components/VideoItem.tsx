'use client'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – MuxPlayer className prop conflicts with its own type def
import MuxPlayer from '@mux/mux-player-react'

interface VideoItemProps {
  url: string
  caption?: string
  className?: string
  onRemove?: () => void
}

/** Mux playback IDs look like alphanumeric strings with no slashes or http */
function isMuxId(url: string): boolean {
  return Boolean(url) && !url.includes('/') && !url.startsWith('http')
}

export default function VideoItem({ url, caption, className = '', onRemove }: VideoItemProps) {
  return (
    <div className={`relative group rounded-xl overflow-hidden bg-black ${className}`}>
      {isMuxId(url) ? (
        <MuxPlayer
          streamType="on-demand"
          playbackId={url}
          muted
          loop
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={url}
          controls
          className="w-full aspect-video"
        />
      )}

      {caption && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-xs text-white/90">{caption}</p>
        </div>
      )}

      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:bg-red-500"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </div>
  )
}
