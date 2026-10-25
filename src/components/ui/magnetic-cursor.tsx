"use client"
import React, { useEffect, useRef, useState } from "react"

export function MagneticCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [trailPosition, setTrailPosition] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  const targetPos = useRef({ x: -100, y: -100 })
  const currentTrail = useRef({ x: -100, y: -100 })
  const animationFrameId = useRef<number | undefined>(undefined)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY }
      setPosition({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea") ||
          target.closest(".interactive") ||
          target.closest("[role='button']"))
      ) {
        setIsHovered(true)
      } else {
        setIsHovered(false)
      }
    }

    const onMouseDown = () => setIsClicking(true)
    const onMouseUp = () => setIsClicking(false)
    const onMouseLeave = () => setIsVisible(false)
    const onMouseEnter = () => setIsVisible(true)

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)
    document.addEventListener("mouseleave", onMouseLeave)
    document.addEventListener("mouseenter", onMouseEnter)

    // Smooth spring lerp for outer ring
    const loop = () => {
      const ease = 0.18
      currentTrail.current.x += (targetPos.current.x - currentTrail.current.x) * ease
      currentTrail.current.y += (targetPos.current.y - currentTrail.current.y) * ease
      setTrailPosition({ x: currentTrail.current.x, y: currentTrail.current.y })
      animationFrameId.current = requestAnimationFrame(loop)
    }
    animationFrameId.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      document.removeEventListener("mouseleave", onMouseLeave)
      document.removeEventListener("mouseenter", onMouseEnter)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer Magnetic Ring */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/60 dark:border-cyan-400/80 transition-[width,height,background-color,border-color] duration-200 ease-out"
        style={{
          left: `${trailPosition.x}px`,
          top: `${trailPosition.y}px`,
          width: isHovered ? "48px" : isClicking ? "22px" : "32px",
          height: isHovered ? "48px" : isClicking ? "22px" : "32px",
          backgroundColor: isHovered
            ? "rgba(6, 182, 212, 0.15)"
            : "rgba(6, 182, 212, 0.04)",
          boxShadow: isHovered
            ? "0 0 20px rgba(34, 211, 238, 0.45), inset 0 0 10px rgba(16, 185, 129, 0.25)"
            : "0 0 10px rgba(6, 182, 212, 0.2)",
        }}
      />

      {/* Inner Precision Dot */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 dark:bg-cyan-300 shadow-[0_0_8px_#22d3ee] transition-transform duration-75 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isClicking ? "8px" : isHovered ? "6px" : "5px",
          height: isClicking ? "8px" : isHovered ? "6px" : "5px",
          transform: `translate(-50%, -50%) scale(${isClicking ? 1.4 : 1})`,
        }}
      />
    </div>
  )
}
