import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { CONFIG_DIR, CONFIG_FILE } from './paths'
import type { AppConfig } from '@shared/types'

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  activeVaultId: null,
  vaults: [],
}

let _config: AppConfig | null = null

export async function loadConfig(): Promise<AppConfig> {
  if (_config) return _config
  try {
    if (!existsSync(CONFIG_FILE)) {
      _config = structuredClone(DEFAULT_CONFIG)
      return _config
    }
    const raw = await readFile(CONFIG_FILE, 'utf-8')
    _config = JSON.parse(raw) as AppConfig
    return _config
  } catch {
    _config = structuredClone(DEFAULT_CONFIG)
    return _config
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  const tmp = CONFIG_FILE + '.tmp'
  await writeFile(tmp, JSON.stringify(config, null, 2), 'utf-8')
  await rename(tmp, CONFIG_FILE)
  _config = config
}

export async function getConfig(): Promise<AppConfig> {
  if (!_config) await loadConfig()
  return _config!
}

export async function updateConfig(
  updater: (config: AppConfig) => AppConfig,
): Promise<AppConfig> {
  const config = await getConfig()
  const updated = updater(structuredClone(config))
  await saveConfig(updated)
  return updated
}
