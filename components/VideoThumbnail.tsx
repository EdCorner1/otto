'use client'

import { useState, useRef } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface VideoThumbnailProps {
  muxPlaybackId: string
  title: string
  subtitle?: string
  badge?: string
  aspectRatio?: '9/16' | '4/3' | '1/1'
  className?: string
  rounded?: string
}

export default function VideoThumbnail({
  muxPlaybackId,
  title,
  subtitle,
  badge,
  aspectRatio = '9/16',
  className = '',
  rounded = 'rounded-2xl',
}: VideoThumbnailProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative overflow-hidden bg-black ${rounded} ${className}`}
      style={{ aspectRatio }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MuxPlayer
        streamType="on-demand"
        playbackId={muxPlaybackId}
        autoPlay={hovered}
        muted
        loop
        className="w-full h-full object-cover"
      />

      {/* Dim overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ backgroundColor: 'rgba(0,0,0,' + (hovered ? '0' : '0.25') + ')' }}
      />

      {/* Badge */}
      {badge && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#363535]">
            {badge}
          </span>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-sm font-semibold leading-tight line-clamp-1">{title}</p>
        {subtitle && (
          <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
