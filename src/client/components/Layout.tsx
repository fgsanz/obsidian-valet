import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { APP_NAME } from '@shared/constants'
import VaultPicker from './VaultPicker'
import ErrorBoundary from './ErrorBoundary'
import Tooltip from './Tooltip'
import SettingsPanel from './SettingsPanel'
import styles from './Layout.module.css'

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false)

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
          <Tooltip content="Settings">
            <button
              type="button"
              className={styles.settingsBtn}
              onClick={() => setSettingsOpen(true)}
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
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
