"use client"
import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"

interface Pixel {
  id: number
  x: number
  y: number
  opacity: number
  age: number
  colorIndex?: number
}

// Aurora palette coordinated colors: polar cyan, arctic teal, borealis emerald, ice highlight
const AURORA_COLORS = [
  "#22d3ee", // cyan-400
  "#06b6d4", // cyan-500
  "#14b8a6", // teal-500
  "#10b981", // emerald-500
  "#38bdf8", // sky-400
  "#a5f3fc", // cyan-200
]

const PIXEL_SIZE = 12
const TRAIL_LENGTH = 40
const FADE_SPEED = 0.04

interface PixelCursorTrailProps {
  colors?: string[]
  pixelSize?: number
  trailLength?: number
  fadeSpeed?: number
  fullScreen?: boolean
  className?: string
  children?: React.ReactNode
}

export function PixelCursorTrail({
  colors = AURORA_COLORS,
  pixelSize = PIXEL_SIZE,
  trailLength = TRAIL_LENGTH,
  fadeSpeed = FADE_SPEED,
  fullScreen = true,
  className,
  children,
}: PixelCursorTrailProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const pixelIdRef = useRef(0)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)

  const createPixel = useCallback((x: number, y: number) => {
    return {
      id: pixelIdRef.current++,
      x,
      y,
      opacity: 1,
      age: 0,
      colorIndex: Math.floor(Math.random() * (colors.length || 1)),
    }
  }, [colors.length])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const dx = x - lastPositionRef.current.x
      const dy = y - lastPositionRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > pixelSize) {
        const newPixel = createPixel(x, y)
        setPixels((prev) => [...prev.slice(-trailLength), newPixel])
        lastPositionRef.current = { x, y }
      }
    },
    [createPixel, pixelSize, trailLength],
  )

  useEffect(() => {
    const animate = () => {
      setPixels((prev) =>
        prev
          .map((pixel) => ({
            ...pixel,
            opacity: pixel.opacity - fadeSpeed,
            age: pixel.age + 1,
          }))
          .filter((pixel) => pixel.opacity > 0),
      )
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [fadeSpeed])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={
        fullScreen
          ? `fixed inset-0 w-screen h-screen bg-background overflow-hidden cursor-none select-none ${className || ""}`
          : `relative w-full h-full overflow-hidden ${className || ""}`
      }
    >
      {pixels.map((pixel) => {
        // Calculate size based on age - older pixels are smaller
        const sizeMultiplier = Math.max(0.3, 1 - pixel.age / 100)
        const currentSize = pixelSize * sizeMultiplier
        const color = colors[pixel.colorIndex ?? 0] || "var(--foreground)"

        return (
          <div
            key={pixel.id}
            className="absolute pointer-events-none rounded-xs"
            style={{
              left: pixel.x - currentSize / 2,
              top: pixel.y - currentSize / 2,
              width: currentSize,
              height: currentSize,
              backgroundColor: color,
              opacity: pixel.opacity,
              boxShadow: `0 0 8px ${color}99`,
              transition: "width 0.1s ease-out, height 0.1s ease-out",
            }}
          />
        )
      })}
      {children}
      {!children && fullScreen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/20">
            Move cursor
          </span>
        </div>
      )}
    </div>
  )
}
