import { APP_VERSION, GITHUB_REPO } from '@shared/constants'

export interface VersionInfo {
  current: string
  /** Latest release version (without the leading "v"), or null if the check failed. */
  latest: string | null
  updateAvailable: boolean
}

function parseSemver(v: string): number[] {
  return v
    .replace(/^v/, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
}

/** True if `latest` is a strictly higher semantic version than `current`. */
export function isNewer(latest: string, current: string): boolean {
  const a = parseSemver(latest)
  const b = parseSemver(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

/**
 * Check GitHub for the latest published release and compare it to the running version.
 * Fails gracefully (no update) when offline or rate-limited — this is the only network call
 * the tool makes, and it is purely informational.
 */
export async function checkLatestVersion(): Promise<VersionInfo> {
  const current = APP_VERSION
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return { current, latest: null, updateAvailable: false }
    const data = (await res.json()) as { tag_name?: string }
    const latest = (data.tag_name ?? '').replace(/^v/, '')
    return { current, latest: latest || null, updateAvailable: !!latest && isNewer(latest, current) }
  } catch {
    return { current, latest: null, updateAvailable: false }
  }
}
