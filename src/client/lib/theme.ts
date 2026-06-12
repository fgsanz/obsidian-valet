export type ColorScheme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'ov-color-scheme'

const systemLight =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)')
    : null

/** Resolve the chosen scheme to the concrete theme to apply. */
function effectiveTheme(scheme: ColorScheme): 'light' | 'dark' {
  if (scheme === 'system') return systemLight?.matches ? 'light' : 'dark'
  return scheme
}

function applyEffective(scheme: ColorScheme): void {
  document.documentElement.setAttribute('data-theme', effectiveTheme(scheme))
}

let systemListener: ((e: MediaQueryListEvent) => void) | null = null

/** The persisted preference, defaulting to following the OS. */
export function getColorScheme(): ColorScheme {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

/** Persist and apply the chosen scheme, keeping the OS in sync when "system" is selected. */
export function setColorScheme(scheme: ColorScheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, scheme)
  } catch {
    // ignore storage failures (e.g. private mode)
  }
  applyEffective(scheme)

  if (systemLight) {
    if (systemListener) {
      systemLight.removeEventListener('change', systemListener)
      systemListener = null
    }
    if (scheme === 'system') {
      systemListener = () => applyEffective('system')
      systemLight.addEventListener('change', systemListener)
    }
  }
}

/** Apply the stored scheme on startup. */
export function initColorScheme(): void {
  setColorScheme(getColorScheme())
}
