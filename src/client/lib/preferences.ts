// User preferences are stored in the browser's localStorage. They live entirely in the browser,
// not in any file tracked by git, so running `git pull` to update the tool never changes them.

const CHECK_UPDATES_KEY = 'ov-check-updates'

/** Whether to check GitHub for a newer version at launch. Defaults to on. */
export function getCheckForUpdates(): boolean {
  try {
    return localStorage.getItem(CHECK_UPDATES_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setCheckForUpdates(enabled: boolean): void {
  try {
    localStorage.setItem(CHECK_UPDATES_KEY, String(enabled))
  } catch {
    // ignore storage failures (e.g. private mode)
  }
}
