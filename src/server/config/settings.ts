import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { CONFIG_DIR, SETTINGS_FILE } from './paths'
import { userSettingsSchema, type UserSettings } from '@shared/schemas'

let _settings: UserSettings | null = null

/**
 * Read settings from disk, filling in defaults for anything missing/invalid (the schema is
 * tolerant). The result is the effective settings; the file is the store of overrides.
 */
export async function getSettings(): Promise<UserSettings> {
  if (_settings) return _settings
  let raw: unknown = {}
  try {
    if (existsSync(SETTINGS_FILE)) {
      raw = JSON.parse(await readFile(SETTINGS_FILE, 'utf-8'))
    }
  } catch {
    raw = {}
  }
  _settings = userSettingsSchema.parse(raw && typeof raw === 'object' ? raw : {})
  return _settings
}

/** Merge a partial patch over the current settings, validate, and persist atomically. */
export async function updateSettings(patch: Record<string, unknown>): Promise<UserSettings> {
  const current = await getSettings()
  const merged = userSettingsSchema.parse({ ...current, ...patch })
  await mkdir(CONFIG_DIR, { recursive: true })
  const tmp = SETTINGS_FILE + '.tmp'
  await writeFile(tmp, JSON.stringify(merged, null, 2), 'utf-8')
  await rename(tmp, SETTINGS_FILE)
  _settings = merged
  return merged
}
