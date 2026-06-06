import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import styles from './DirSelect.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  dirs: string[]
  placeholder?: string
  disabled?: boolean
}

export default function DirSelect({ value, onChange, dirs, placeholder = 'directory', disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? dirs.filter((d) => d.toLowerCase().includes(value.trim().toLowerCase()))
    : dirs

  function handleChange(v: string) {
    onChange(v)
    setOpen(true)
    setFocusedIdx(-1)
  }

  function select(dir: string) {
    onChange(dir)
    setOpen(false)
    setFocusedIdx(-1)
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIdx >= 0 && filtered[focusedIdx]) {
        select(filtered[focusedIdx])
      } else if (filtered.length === 1) {
        select(filtered[0])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIdx(-1)
    }
  }

  useEffect(() => {
    if (focusedIdx < 0 || !dropdownRef.current) return
    const el = dropdownRef.current.children[focusedIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusedIdx])

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        className={styles.input}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
      />
      {open && !disabled && (
        <div className={styles.dropdown} ref={dropdownRef}>
          {filtered.length > 0 ? (
            filtered.map((dir, idx) => (
              <div
                key={dir}
                className={`${styles.option} ${idx === focusedIdx ? styles.focused : ''}`}
                onPointerDown={(e) => { e.preventDefault(); select(dir) }}
              >
                {dir}
              </div>
            ))
          ) : (
            <div className={styles.empty}>No matching directory</div>
          )}
        </div>
      )}
    </div>
  )
}
