import { useState, useRef, useEffect } from 'react'
import styles from './Tooltip.module.css'

interface Props {
  content: string
  children: React.ReactNode
  /** Optional class for the trigger wrapper (e.g. to position it). */
  className?: string
}

export default function Tooltip({ content, children, className }: Props) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        })
      }
      setShow(true)
    }, 150)
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }

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
        <div className={styles.tooltip} style={{ top: position.top, left: position.left }}>
          {content}
        </div>
      )}
    </>
  )
}
