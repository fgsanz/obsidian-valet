import { Outlet, NavLink, Link } from 'react-router-dom'
import { APP_NAME } from '@shared/constants'
import VaultPicker from './VaultPicker'
import ErrorBoundary from './ErrorBoundary'
import styles from './Layout.module.css'

export default function Layout() {
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
        </div>
      </nav>
      <main className={styles.main}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
