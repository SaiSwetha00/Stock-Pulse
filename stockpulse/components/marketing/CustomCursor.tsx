'use client'

import { useEffect, useState } from 'react'

/**
 * UNREFERENCED AS OF 2026-08-20. `Landing.tsx` no longer mounts this; the
 * reasoning is recorded at the removal site and in D59. In short: it drew a
 * gold dot and a trailing crimson-dotted ring over the visitor's own cursor
 * (nothing in this project sets `cursor: none`), and a reviewer of the new
 * hero reported the pair as a suspected rendering artifact.
 *
 * Left in place so restoring it is one import if that judgement is reversed.
 * If it is, set `cursor: none` on `.sp-landing` in the same change — the
 * component was only ever half-installed without it.
 */
export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [trailingPos, setTrailingPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show custom cursor on fine pointer devices (desktop). One-time
    // client-only capability check, not a value that can be read during
    // render, so it has to run here rather than as a lazy initial state.
    if (window.matchMedia('(pointer: coarse)').matches) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVisible(true)

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('.interactive-card')
      ) {
        setIsHovered(true)
      } else {
        setIsHovered(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  useEffect(() => {
    let animationFrameId: number
    const updateTrailing = () => {
      setTrailingPos((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.15,
        y: prev.y + (position.y - prev.y) * 0.15,
      }))
      animationFrameId = requestAnimationFrame(updateTrailing)
    }
    animationFrameId = requestAnimationFrame(updateTrailing)
    return () => cancelAnimationFrame(animationFrameId)
  }, [position])

  if (!isVisible) return null

  return (
    <>
      {/* Outer Ring */}
      <div
        className={`fixed top-0 left-0 w-8 h-8 rounded-full border border-[#edc155]/60 pointer-events-none z-[9999] mix-blend-screen transition-transform duration-200 ease-out flex items-center justify-center ${
          isHovered ? 'scale-150 bg-[#edc155]/15 border-[#edc155]' : 'scale-100'
        }`}
        style={{
          transform: `translate3d(${trailingPos.x - 16}px, ${trailingPos.y - 16}px, 0) scale(${
            isHovered ? 1.5 : 1
          })`,
        }}
      >
        <div className="w-1.5 h-1.5 bg-[#93000a] rounded-full shadow-[0_0_8px_#edc155]" />
      </div>

      {/* Immediate Dot */}
      <div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#edc155] pointer-events-none z-[10000] shadow-[0_0_6px_#edc155]"
        style={{
          transform: `translate3d(${position.x - 4}px, ${position.y - 4}px, 0)`,
        }}
      />
    </>
  )
}
