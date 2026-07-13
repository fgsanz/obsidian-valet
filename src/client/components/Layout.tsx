import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { Settings, Bell, BellDot } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { APP_NAME } from '@shared/constants'
import type { UserSettings } from '@shared/schemas'
import { api } from '../api/client'
import { checkLatestVersion } from '../lib/version'
import { applyColorScheme, type ColorScheme } from '../lib/theme'
import { shouldWarnNoGit, type GitWarning } from '../lib/gitWarning'
import { forgetVault } from '@shared/settings'
import VaultPicker from './VaultPicker'
import ErrorBoundary from './ErrorBoundary'
import Tooltip from './Tooltip'
import SettingsPanel from './SettingsPanel'
import HomeNavHints from './HomeNavHints'
import styles from './Layout.module.css'

const DEFAULT_SETTINGS: UserSettings = {
  schemaVersion: 1,
  colorScheme: 'system',
  checkForUpdates: true,
  dismissedVersion: null,
  gitAckVaultIds: [],
}

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gitWarning, setGitWarning] = useState<GitWarning | null>(null)
  const queryClient = useQueryClient()
  const location = useLocation()
  // The Support top-nav item lives under /docs, so keep "Docs" from also highlighting there.
  const onSupport = location.pathname === '/docs/support'
  const isHome = location.pathname === '/'

  // Anchor the home-page hand-drawn hints to the real nav links so they track the menu entries as
  // the window resizes (measured in viewport coords; the hints overlay is position: fixed).
  const vaultsLinkRef = useRef<HTMLAnchorElement>(null)
  const opsLinkRef = useRef<HTMLAnchorElement>(null)
  const [navAnchors, setNavAnchors] = useState<{ vaults: number; ops: number } | null>(null)
  useLayoutEffect(() => {
    if (!isHome) {
      setNavAnchors(null)
      return
    }
    function measure() {
      const v = vaultsLinkRef.current?.getBoundingClientRect()
      const o = opsLinkRef.current?.getBoundingClientRect()
      if (v && o) setNavAnchors({ vaults: v.left + v.width / 2, ops: o.left + o.width / 2 })
    }
    measure()
    const raf = requestAnimationFrame(measure) // re-measure once fonts/layout have settled
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [isHome])

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    staleTime: Infinity,
  })
  const s = settings ?? DEFAULT_SETTINGS

  const { data: activeVault } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  const { data: gitStatus } = useQuery({
    queryKey: ['git', 'status', activeVault?.id],
    queryFn: () => api.git.status(activeVault!.id),
    enabled: !!activeVault?.id,
  })

  // Whenever the active vault changes (from the header picker or the Vaults page) — anywhere in the
  // app — surface a notice if that vault has no Git rollback and hasn't been acknowledged.
  useEffect(() => {
    if (!activeVault || gitStatus === undefined) {
      setGitWarning(null)
      return
    }
    // Git has since been added to a vault we'd previously flagged as "no Git": drop the now-stale
    // acknowledgment so settings stay accurate (and the warning correctly returns if Git is ever
    // removed again). The hasGit check below already keeps the notice itself hidden.
    if (gitStatus.hasGit && (s.gitAckVaultIds ?? []).includes(activeVault.id)) {
      patchSettings({ gitAckVaultIds: forgetVault(s, activeVault.id).gitAckVaultIds })
    }
    setGitWarning(
      shouldWarnNoGit(gitStatus.hasGit, activeVault.id, s.gitAckVaultIds ?? [])
        ? { vaultId: activeVault.id, vaultName: activeVault.name }
        : null,
    )
  }, [activeVault, gitStatus, s.gitAckVaultIds])

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => api.settings.update(patch),
    onSuccess: (updated) => queryClient.setQueryData(['settings'], updated),
  })

  // Apply the authoritative color scheme once settings have loaded (before that, the inline
  // script in index.html has already painted from the localStorage mirror — no flash).
  useEffect(() => {
    if (settings) applyColorScheme(settings.colorScheme)
  }, [settings?.colorScheme]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: versionInfo } = useQuery({
    queryKey: ['version'],
    queryFn: checkLatestVersion,
    // Re-check periodically so a release published while the GUI is open is noticed without a
    // reload: every 6 hours, and whenever the window regains focus (if the data is >1h old).
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60 * 6, // 6 hours
    refetchOnWindowFocus: true,
    retry: false,
    enabled: s.checkForUpdates,
  })

  const updateAvailable = s.checkForUpdates && !!versionInfo?.updateAvailable
  const latest = versionInfo?.latest ?? null
  const versionUnread = updateAvailable && latest !== s.dismissedVersion

  // A no-Git warning is "unread" until the user opens it (clicks the bell), after which the vault
  // is acknowledged and never warned about again.
  const gitUnread = !!gitWarning && !(s.gitAckVaultIds ?? []).includes(gitWarning.vaultId)
  const hasUnread = versionUnread || gitUnread

  // Optimistically update the cache for snappy controls, then persist to the server.
  function patchSettings(patch: Partial<UserSettings>) {
    queryClient.setQueryData<UserSettings>(['settings'], (prev) => ({
      ...(prev ?? DEFAULT_SETTINGS),
      ...patch,
    }))
    updateMutation.mutate(patch)
  }

  function handleBellClick() {
    setSettingsOpen(true)
    if (latest && latest !== s.dismissedVersion) {
      patchSettings({ dismissedVersion: latest })
    }
  }

  // Acknowledge the no-Git notice for this vault — persist it and drop the warning so the bell
  // and the notification clear. Triggered by the "Got it" button inside the settings panel.
  function ackGitWarning() {
    if (!gitWarning) return
    if (!(s.gitAckVaultIds ?? []).includes(gitWarning.vaultId)) {
      patchSettings({ gitAckVaultIds: [...(s.gitAckVaultIds ?? []), gitWarning.vaultId] })
    }
    setGitWarning(null)
  }

  function changeColorScheme(scheme: ColorScheme) {
    applyColorScheme(scheme)
    patchSettings({ colorScheme: scheme })
  }

  function changeCheckForUpdates(enabled: boolean) {
    patchSettings({ checkForUpdates: enabled })
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>{APP_NAME}</Link>
        <div className={styles.links}>
          <NavLink
            to="/vaults"
            ref={vaultsLinkRef}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Vaults
          </NavLink>
          <NavLink
            to="/metadata"
            ref={opsLinkRef}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Metadata
          </NavLink>
          <NavLink
            to="/content"
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Content
          </NavLink>
          <NavLink
            to="/analysis"
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Analysis
          </NavLink>
          <NavLink
            to="/docs"
            className={({ isActive }) => (isActive && !onSupport ? styles.active : undefined)}
          >
            Docs
          </NavLink>
          <NavLink
            to="/docs/support"
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            Support
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
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </Tooltip>
        </div>
      </nav>
      {isHome && navAnchors && <HomeNavHints vaultsX={navAnchors.vaults} opsX={navAnchors.ops} />}
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
        gitWarningVaultName={gitUnread ? gitWarning?.vaultName ?? null : null}
        onAckGitWarning={ackGitWarning}
        colorScheme={s.colorScheme}
        onColorSchemeChange={changeColorScheme}
        checkForUpdates={s.checkForUpdates}
        onCheckForUpdatesChange={changeCheckForUpdates}
      />
    </div>
  )
}
