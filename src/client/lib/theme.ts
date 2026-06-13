import type { UserSettings } from '@shared/schemas'

export type ColorScheme = UserSettings['colorScheme']

// Mirror of the *resolved* theme ('light' | 'dark') so the inline script in index.html can paint
// the correct theme before the React app (and its settings fetch) loads. The server settings file
// is the source of truth; this mirror only exists to avoid a flash on subsequent loads.
const MIRROR_KEY = 'ov-theme'

const systemLight =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)')
    : null

function resolve(scheme: ColorScheme): 'light' | 'dark' {
  if (scheme === 'system') return systemLight?.matches ? 'light' : 'dark'
  return scheme
}

function paint(resolved: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', resolved)
  try {
    localStorage.setItem(MIRROR_KEY, resolved)
  } catch {
    // ignore storage failures
  }
}

let systemListener: ((e: MediaQueryListEvent) => void) | null = null

/** Apply a color scheme: set `data-theme`, update the mirror, and follow the OS while "system". */
export function applyColorScheme(scheme: ColorScheme): void {
  paint(resolve(scheme))

  if (systemLight) {
    if (systemListener) {
      systemLight.removeEventListener('change', systemListener)
      systemListener = null
    }
    if (scheme === 'system') {
      systemListener = () => paint(resolve('system'))
      systemLight.addEventListener('change', systemListener)
    }
  }
}
