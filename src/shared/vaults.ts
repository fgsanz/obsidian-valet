import type { Vault } from './types'

/**
 * Order vaults so the active one is first, keeping the relative order of the rest. Returns a new
 * array (never mutates the input). A no-op when there's no active vault, the active id isn't in the
 * list, or there's a single vault.
 */
export function sortVaultsActiveFirst(vaults: Vault[], activeVaultId: string | null): Vault[] {
  if (!activeVaultId) return [...vaults]
  const active = vaults.filter((v) => v.id === activeVaultId)
  const rest = vaults.filter((v) => v.id !== activeVaultId)
  return [...active, ...rest]
}
