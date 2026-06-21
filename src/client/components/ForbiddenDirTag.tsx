import { useState } from 'react'
import { X } from 'lucide-react'
import styles from './ForbiddenDirTag.module.css'

interface Props {
  dir: string
  onRemove: () => void
}

/**
 * A forbidden-directory chip with a remove button. Hovering the remove icon tints the whole chip
 * red (border + background), the same danger cue used on the vault card's delete hover.
 */
export default function ForbiddenDirTag({ dir, onRemove }: Props) {
  const [removeHover, setRemoveHover] = useState(false)
  return (
    <span className={`${styles.tag} ${removeHover ? styles.tagDanger : ''}`}>
      {dir}
      <button
        type="button"
        className={styles.tagRemove}
        aria-label={`Remove ${dir}`}
        onMouseEnter={() => setRemoveHover(true)}
        onMouseLeave={() => setRemoveHover(false)}
        onClick={onRemove}
      >
        <X size={14} />
      </button>
    </span>
  )
}
