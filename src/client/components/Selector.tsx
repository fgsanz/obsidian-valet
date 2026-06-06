import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import Tooltip from './Tooltip'
import styles from './Selector.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  /** The suggestions shown in the dropdown. The user may still type a value not in this list. */
  options: string[]
  placeholder?: string
  disabled?: boolean
  /** Message shown when nothing in `options` matches the typed text. */
  emptyMessage?: string
  /** Optional fixed width (e.g. a CSS length). When omitted the field grows to fill its row. */
  width?: string
}

export default function Selector({
  value,
  onChange,
  options,
  placeholder = '',
  disabled,
  emptyMessage = 'No matches',
  width,
}: Props) {
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [clearHover, setClearHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? options.filter((d) => d.toLowerCase().includes(value.trim().toLowerCase()))
    : options

  function handleChange(v: string) {
    onChange(v)
    setOpen(true)
    setFocusedIdx(-1)
  }

  function select(option: string) {
    onChange(option)
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
    <div className={styles.wrapper} style={width ? { flex: 'none', width } : undefined}>
      <input
        ref={inputRef}
        className={`${styles.input} ${clearHover ? styles.inputClearHover : ''}`}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
      />
      {value && !disabled && (
        <Tooltip content="Clear" className={styles.clearBtn}>
          <button
            type="button"
            className={styles.clearBtnButton}
            aria-label="Clear selection"
            onMouseEnter={() => setClearHover(true)}
            onMouseLeave={() => setClearHover(false)}
            onPointerDown={(e) => {
              e.preventDefault()
              onChange('')
              setClearHover(false)
              inputRef.current?.focus()
            }}
          >
            <X size={14} />
          </button>
        </Tooltip>
      )}
      {open && !disabled && (
        <div className={styles.dropdown} ref={dropdownRef}>
          {filtered.length > 0 ? (
            filtered.map((option, idx) => (
              <div
                key={option}
                className={`${styles.option} ${idx === focusedIdx ? styles.focused : ''}`}
                onPointerDown={(e) => { e.preventDefault(); select(option) }}
              >
                {option}
              </div>
            ))
          ) : (
            <div className={styles.empty}>{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  )
}
