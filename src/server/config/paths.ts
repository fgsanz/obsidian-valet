import { homedir } from 'os'
import { join } from 'path'

/**
 * Per-OS application config directory, following each platform's convention:
 *   - Windows: %APPDATA%\<app>            (e.g. C:\Users\me\AppData\Roaming\obsidian-valet)
 *   - macOS:   ~/Library/Application Support/<app>
 *   - Linux:   $XDG_CONFIG_HOME/<app>     (defaults to ~/.config/<app>)
 */
function configDir(appName: string): string {
  const home = homedir()
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), appName)
  }
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', appName)
  }
  return join(process.env.XDG_CONFIG_HOME ?? join(home, '.config'), appName)
}

export const CONFIG_DIR = configDir('obsidian-valet')
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
