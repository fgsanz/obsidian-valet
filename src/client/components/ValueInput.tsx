import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import Tooltip from './Tooltip'
import styles from './ValueInput.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Highlight the field as invalid (red border/background). */
  invalid?: boolean
}

/**
 * A free-text value field with a clear ("×") button — mirroring the clear affordance of the
 * property Selector, including the red highlight on the field while hovering the clear icon.
 */
export default function ValueInput({ value, onChange, placeholder, invalid = false }: Props) {
  const [clearHover, setClearHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        className={`${styles.input} ${invalid ? styles.inputInvalid : ''} ${clearHover ? styles.inputClearHover : ''}`}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <Tooltip content="Clear" className={styles.clearBtn}>
          <button
            type="button"
            className={styles.clearBtnButton}
            aria-label="Clear value"
            onMouseEnter={() => setClearHover(true)}
            onMouseLeave={() => setClearHover(false)}
            onPointerDown={(e) => {
              e.preventDefault()
              onChange('')
              setClearHover(false)
              inputRef.current?.blur()
            }}
          >
            <X size={14} />
          </button>
        </Tooltip>
      )}
    </div>
  )
}
