import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import styles from './Tooltip.module.css'

/** Keep the tooltip this many px away from the viewport edges. */
const EDGE_MARGIN = 8

interface Props {
  content: string
  children: React.ReactNode
  /** Optional class for the trigger wrapper (e.g. to position it). */
  className?: string
}

export default function Tooltip({ content, children, className }: Props) {
  const [show, setShow] = useState(false)
  // `anchor` is the desired center under the trigger; `left` is that center after
  // clamping so the (now wrapping) tooltip stays fully inside the viewport.
  const [anchor, setAnchor] = useState({ top: 0, left: 0 })
  const [left, setLeft] = useState(0)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const center = rect.left + rect.width / 2
        setAnchor({ top: rect.bottom + 8, left: center })
        setLeft(center)
      }
      setShow(true)
    }, 150)
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }

  // After it renders at full size, clamp the centered position so neither edge
  // spills out of the viewport (the tooltip is centered via translateX(-50%)).
  useLayoutEffect(() => {
    if (!show || !tooltipRef.current) return
    const half = tooltipRef.current.offsetWidth / 2
    const min = EDGE_MARGIN + half
    const max = window.innerWidth - EDGE_MARGIN - half
    const clamped = Math.min(Math.max(anchor.left, min), max)
    if (clamped !== left) setLeft(clamped)
  }, [show, anchor, left])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <>
      <div ref={triggerRef} className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </div>
      {show && (
        <div ref={tooltipRef} className={styles.tooltip} style={{ top: anchor.top, left }}>
          {content}
        </div>
      )}
    </>
  )
}
