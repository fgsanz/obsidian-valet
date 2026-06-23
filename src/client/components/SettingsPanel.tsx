import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight } from 'lucide-react'
import { APP_VERSION } from '@shared/constants'
import { type ColorScheme } from '../lib/theme'
import styles from './SettingsPanel.module.css'

interface Props {
  open: boolean
  onClose: () => void
  updateAvailable?: boolean
  latestVersion?: string | null
  /** Name of the active vault that has no Git rollback, or null if none to warn about. */
  gitWarningVaultName?: string | null
  /** Acknowledge the no-Git notice for the active vault (never warn about it again). */
  onAckGitWarning?: () => void
  colorScheme?: ColorScheme
  onColorSchemeChange?: (scheme: ColorScheme) => void
  checkForUpdates?: boolean
  onCheckForUpdatesChange?: (enabled: boolean) => void
}

export default function SettingsPanel({
  open,
  onClose,
  updateAvailable = false,
  latestVersion = null,
  gitWarningVaultName = null,
  onAckGitWarning,
  colorScheme = 'system',
  onColorSchemeChange,
  checkForUpdates = true,
  onCheckForUpdatesChange,
}: Props) {
  const navigate = useNavigate()

  function openChangelog() {
    onClose()
    navigate('/docs/changelog')
  }

  function openGitDoc() {
    onClose()
    navigate('/docs/git-integration')
  }

  const hasNotifications = (updateAvailable && latestVersion) || gitWarningVaultName

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
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Settings</h2>
            <span className={styles.version}>v{APP_VERSION}</span>
          </div>
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
          {/* Notifications */}
          <div className={styles.sectionLabel}>Notifications</div>
          {updateAvailable && latestVersion && (
            <button type="button" className={styles.notification} onClick={openChangelog}>
              <span className={styles.notificationDot} />
              <span className={styles.notificationText}>
                Version <strong>v{latestVersion}</strong> is available
              </span>
            </button>
          )}
          {gitWarningVaultName && (
            <div className={`${styles.notification} ${styles.notificationStatic}`}>
              <span className={styles.notificationDot} />
              <div className={styles.notificationBody}>
                <span className={styles.notificationText}>
                  <strong>{gitWarningVaultName}</strong> has no Git-enabled rollback. Operations
                  cannot be easily undone.
                </span>
                <div className={styles.notificationActions}>
                  <button type="button" className={styles.notificationLinkBtn} onClick={openGitDoc}>
                    Learn more
                  </button>
                  <button type="button" className={styles.gotItBtn} onClick={onAckGitWarning}>
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
          {!hasNotifications && (
            <div className={styles.emptyNote}>You're up to date — no notifications.</div>
          )}

          {/* Check for new version */}
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingTitle}>Check for new version</div>
              <div className={styles.settingDesc}>Checks for a newer version periodically.</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={checkForUpdates}
              aria-label="Check for new version"
              className={`${styles.toggle} ${checkForUpdates ? styles.toggleOn : ''}`}
              onClick={() => onCheckForUpdatesChange?.(!checkForUpdates)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          {/* Changelog link */}
          <button type="button" className={styles.setting} onClick={openChangelog}>
            <div className={styles.settingInfo}>
              <div className={styles.settingTitle}>
                Changelog
                {updateAvailable && <span className={styles.newBadge}>New version available</span>}
              </div>
              <div className={styles.settingDesc}>What's new in each version.</div>
            </div>
            <ChevronRight size={18} className={styles.chevron} />
          </button>

          {/* Appearance */}
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingTitle}>Color scheme</div>
              <div className={styles.settingDesc}>Choose the tool's color scheme.</div>
            </div>
            <select
              className={styles.select}
              value={colorScheme}
              onChange={(e) => onColorSchemeChange?.(e.target.value as ColorScheme)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">Follow system</option>
            </select>
          </div>
        </div>
      </aside>
    </>
  )
}
