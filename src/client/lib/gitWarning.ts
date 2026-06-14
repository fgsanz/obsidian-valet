/**
 * Whether to warn the user that the active vault has no Git-enabled rollback.
 * We warn only when the vault lacks Git AND the user hasn't already acknowledged the notice for
 * that specific vault — acknowledging one vault never suppresses the warning for others.
 */
export function shouldWarnNoGit(hasGit: boolean, vaultId: string, ackedVaultIds: string[]): boolean {
  return !hasGit && !ackedVaultIds.includes(vaultId)
}

export interface GitWarning {
  vaultId: string
  vaultName: string
}
