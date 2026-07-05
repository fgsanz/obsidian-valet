import { unlink, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { buildSplitNotes } from './kindle'
import { createNote } from './frontmatter'
import { revertToHead } from './git'
import type { ParsedNote, PropertyDef, KindleSplitOptions, KindleSplitResult } from '@shared/types'

/** A split failure with a stable code, so routes can map it to the right HTTP status. */
export class KindleSplitError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

async function pathExists(p: string): Promise<boolean> {
  return stat(p).then(() => true).catch(() => false)
}

/**
 * Apply a Kindle-highlights split to disk: create one note per highlight in the target folder,
 * optionally deleting the original. Refuses the whole operation up front if any target file already
 * exists (never overwrites), and rolls back everything it created if a write fails partway — so a
 * failed split never leaves partial output. Returns the created paths for a clean revert.
 */
export async function applyKindleSplit(
  vaultPath: string,
  note: ParsedNote,
  options: KindleSplitOptions,
  defs: PropertyDef[],
): Promise<KindleSplitResult> {
  const splits = buildSplitNotes(note, options, defs)
  if (splits.length === 0) {
    throw new KindleSplitError('NOT_KINDLE', 'The selected note has no Kindle highlights to split.')
  }

  const vaultAbs = resolve(vaultPath)
  const targetAbs = resolve(vaultAbs, options.targetDir)
  // Guard against path traversal — the target must stay inside the vault.
  if (targetAbs !== vaultAbs && !targetAbs.startsWith(vaultAbs + '/')) {
    throw new KindleSplitError('BAD_TARGET', 'Target folder is outside the vault.')
  }

  const targets = splits.map((s) => ({ fileName: s.fileName, content: s.content, abs: join(targetAbs, s.fileName) }))

  // Refuse the whole operation if any target already exists — never overwrite silently.
  const collisions: string[] = []
  for (const t of targets) {
    if (await pathExists(t.abs)) collisions.push(t.fileName)
  }
  if (collisions.length > 0) {
    throw new KindleSplitError(
      'COLLISION',
      `${collisions.length} note(s) already exist in the target folder (e.g. "${collisions[0]}"). Nothing was written.`,
    )
  }

  const createdPaths: string[] = []
  try {
    for (const t of targets) {
      await createNote(t.abs, t.content)
      createdPaths.push(t.abs.slice(vaultAbs.length + 1))
    }
  } catch (err) {
    // Roll back any files already created so a failed split leaves no partial output.
    await Promise.all(createdPaths.map((rel) => unlink(join(vaultAbs, rel)).catch(() => {})))
    throw err
  }

  let originalDeleted = false
  if (options.deleteOriginal) {
    await unlink(note.filePath).catch(() => {})
    originalDeleted = true
  }

  return { created: createdPaths.length, createdPaths, originalDeleted }
}

/**
 * Undo an applied split: delete the notes it created (they are untracked, so `git reset --hard` on
 * its own would leave them behind) and, when a safety snapshot was taken, reset tracked files to it
 * — restoring the original note if it had been deleted.
 */
export async function revertKindleSplit(
  vaultPath: string,
  createdPaths: string[],
  resetToHead: boolean,
): Promise<void> {
  await Promise.all(createdPaths.map((rel) => unlink(join(vaultPath, rel)).catch(() => {})))
  if (resetToHead) await revertToHead(vaultPath)
}
