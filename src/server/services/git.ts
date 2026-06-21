import simpleGit from 'simple-git'
import type { GitStatus } from '@shared/types'
import { APP_NAME } from '@shared/constants'

export async function getGitStatus(vaultPath: string): Promise<GitStatus> {
  try {
    const git = simpleGit(vaultPath)
    const status = await git.status()
    return {
      hasGit: true,
      isDirty: !status.isClean(),
      stagedCount: status.staged.length,
      unstagedCount: status.modified.length + status.not_added.length,
    }
  } catch {
    return { hasGit: false, isDirty: false, stagedCount: 0, unstagedCount: 0 }
  }
}

/**
 * Stage everything and commit. `allowEmpty` records a commit even when nothing changed — used for
 * the safety snapshot, so an explicitly requested "Before" snapshot always lands in history (and
 * marks the exact pre-operation state) even if the vault is already clean.
 */
export async function commitAll(
  vaultPath: string,
  message: string,
  allowEmpty = false,
): Promise<string> {
  const git = simpleGit(vaultPath)
  await git.add('-A')
  const result = await git.commit(message, undefined, allowEmpty ? { '--allow-empty': null } : undefined)
  return result.commit
}

export function suggestCommitMessage(context: string): string {
  return `chore: snapshot before ${context} [${APP_NAME}]`
}

/**
 * Discard all uncommitted working-tree changes, returning tracked files to the last commit
 * (the safety snapshot taken before the operation). Used to revert an applied operation.
 */
export async function revertToHead(vaultPath: string): Promise<void> {
  const git = simpleGit(vaultPath)
  await git.reset(['--hard', 'HEAD'])
}
