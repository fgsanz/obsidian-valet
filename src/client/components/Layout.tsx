import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { Settings, Bell, BellDot } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { APP_NAME } from '@shared/constants'
import { checkLatestVersion } from '../lib/version'
import { getCheckForUpdates, setCheckForUpdates } from '../lib/preferences'
import VaultPicker from './VaultPicker'
import ErrorBoundary from './ErrorBoundary'
import Tooltip from './Tooltip'
import SettingsPanel from './SettingsPanel'
import styles from './Layout.module.css'

const DISMISSED_KEY = 'ov-dismissed-version'

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY)
    } catch {
      return null
    }
  })

  const [checkForUpdates, setCheckForUpdatesState] = useState<boolean>(getCheckForUpdates)

  const { data: versionInfo } = useQuery({
    queryKey: ['version'],
    queryFn: checkLatestVersion,
    staleTime: Infinity,
    retry: false,
    enabled: checkForUpdates,
  })

  function toggleCheckForUpdates(enabled: boolean) {
    setCheckForUpdatesState(enabled)
    setCheckForUpdates(enabled)
  }

  const updateAvailable = checkForUpdates && !!versionInfo?.updateAvailable
  const latest = versionInfo?.latest ?? null
  // The bell lights up only for an update the user hasn't acknowledged yet.
  const hasUnread = updateAvailable && latest !== dismissedVersion

  function openSettings() {
    setSettingsOpen(true)
  }

  function handleBellClick() {
    setSettingsOpen(true)
    // Clicking the bell marks the current update as read.
    if (latest) {
      setDismissedVersion(latest)
      try {
        localStorage.setItem(DISMISSED_KEY, latest)
      } catch {
        // ignore storage failures
      }
    }
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>{APP_NAME}</Link>
        <div className={styles.links}>
          <NavLink
            to="/vaults"
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Vaults
          </NavLink>
          <NavLink
            to="/ops"
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Operations
          </NavLink>
          <NavLink
            to="/docs"
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Docs
          </NavLink>
        </div>
        <div className={styles.right}>
          <VaultPicker />
          <Tooltip content={hasUnread ? 'Notifications' : 'No notifications'}>
            <button
              type="button"
              className={`${styles.iconBtn} ${hasUnread ? styles.iconBtnAlert : ''}`}
              onClick={handleBellClick}
              aria-label="Notifications"
            >
              {hasUnread ? <BellDot size={18} /> : <Bell size={18} />}
            </button>
          </Tooltip>
          <Tooltip content="Settings">
            <button
              type="button"
              className={styles.iconBtn}
              onClick={openSettings}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </Tooltip>
        </div>
      </nav>
      <main className={styles.main}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        updateAvailable={updateAvailable}
        latestVersion={latest}
        checkForUpdates={checkForUpdates}
        onCheckForUpdatesChange={toggleCheckForUpdates}
      />
    </div>
  )
}
