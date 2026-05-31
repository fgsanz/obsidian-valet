import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import styles from './DirPicker.module.css'

interface Props {
  dirs: string[]
  onAdd: (dir: string) => void
  disabled?: boolean
}

export default function DirPicker({ dirs, onAdd, disabled }: Props) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? dirs.filter((d) => d.toLowerCase().includes(value.trim().toLowerCase()))
    : dirs

  const isExact = dirs.includes(value.trim())

  function select(dir: string) {
    onAdd(dir)
    setValue('')
    setOpen(false)
    setFocusedIdx(-1)
    inputRef.current?.focus()
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
      } else if (isExact) {
        select(value.trim())
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIdx(-1)
    }
  }

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIdx < 0 || !dropdownRef.current) return
    const el = dropdownRef.current.children[focusedIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusedIdx])

  // Close dropdown when clicking outside
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
        placeholder="Type the name of a folder"
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
          setFocusedIdx(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
      />

      {open && !disabled && value.trim() !== '' && (
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
            <div className={styles.empty}>No matching folder found</div>
          )}
        </div>
      )}
    </div>
  )
}
