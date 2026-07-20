'use client'

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'motion'

const DOT_COUNT = 3

export function JumpingDotsLoader() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dots = containerRef.current?.querySelectorAll('.jumping-dot')
    if (!dots?.length) return

    const controls = animate(
      dots,
      { transform: 'translateY(-12px)' },
      {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
        delay: stagger(0.2, { startDelay: -0.5 }),
      }
    )

    return () => controls.stop()
  }, [])

  return (
    <div ref={containerRef} className="flex items-center justify-center gap-2.5" aria-hidden="true">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <div
          key={index}
          className="jumping-dot h-2.5 w-2.5 rounded-full bg-blue-700 will-change-transform dark:bg-blue-400"
        />
      ))}
    </div>
  )
}
