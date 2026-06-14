import type { UserSettings } from './schemas'

/**
 * Drop all per-vault state for a deleted vault, so removing a vault never leaves orphaned settings
 * behind. Add any future per-vault setting here to keep deletion cleanup in one place.
 */
export function forgetVault(settings: UserSettings, vaultId: string): UserSettings {
  return {
    ...settings,
    gitAckVaultIds: settings.gitAckVaultIds.filter((id) => id !== vaultId),
  }
}
