'use client'

import MuxPlayer from '@mux/mux-player-react'
import { useState } from 'react'

interface VideoItemProps {
  url: string
  caption?: string
  className?: string
  onRemove?: () => void
}

/**
 * Renders a portfolio video item.
 * - If url looks like a Mux playback ID (no slashes, alphanumeric), use MuxPlayer.
 * - Otherwise fall back to a plain <video> tag for legacy URLs.
 */
export default function VideoItem({ url, caption, className = '', onRemove }: VideoItemProps) {
  const [playing, setPlaying] = useState(false)
  const isMuxId = url && !url.includes('/') && !url.startsWith('http')

  return (
    <div className={`relative group rounded-xl overflow-hidden bg-black ${className}`}>
      {isMuxId ? (
        <MuxPlayer
          streamType="on-demand"
          playbackId={url}
          autoPlay={playing}
          muted
          loop
          onClick={() => setPlaying(p => !p)}
          className="w-full aspect-video cursor-pointer"
          style={{ '--controls': playing ? 'visible' : 'hidden' } as React.CSSProperties}
        />
      ) : (
        <video
          src={url}
          controls
          className="w-full aspect-video"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
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