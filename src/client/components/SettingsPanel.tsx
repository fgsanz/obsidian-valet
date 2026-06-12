import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import styles from './SettingsPanel.module.css'

interface Props {
  open: boolean
  onClose: () => void
}

type ColorScheme = 'light' | 'dark' | 'system'

export default function SettingsPanel({ open, onClose }: Props) {
  // Selection only for now — actually applying the color scheme will come later.
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system')

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />
      <aside
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        aria-hidden={!open}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingTitle}>Color scheme</div>
              <div className={styles.settingDesc}>Choose the application's color scheme.</div>
            </div>
            <select
              className={styles.select}
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">Adapt to system</option>
            </select>
          </div>
        </div>
      </aside>
    </>
  )
}
