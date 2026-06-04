import { readFile } from 'node:fs/promises'
import { World, setWorldConstructor } from '@cucumber/cucumber'
import type {
  Vault,
  ParsedNote,
  FilterCriteria,
  OperationResult,
} from '@shared/types'
import { scanVault } from '../../src/server/services/scanner'
import { parseNote } from '../../src/server/services/frontmatter'
import { TEST_VAULT_PROPERTIES } from './vault-schema'

/**
 * Per-scenario test state. A fresh instance is created by Cucumber for every scenario,
 * so nothing leaks between scenarios. The temp vault copy is created in the Before hook
 * and removed in the After hook (see hooks.ts).
 */
export class ValetWorld extends World {
  /** Absolute path to the throwaway copy of the test vault for this scenario. */
  tmpVaultDir = ''
  /** Vault object pointing at the temp copy. */
  vault!: Vault
  /** Notes from the most recent scan. */
  notes: ParsedNote[] = []
  /** Notes matched by the most recent filter. */
  matched: ParsedNote[] = []
  /** Result of the most recent applied operation. */
  result: OperationResult | null = null
  /** Filter criteria being assembled by When steps. */
  criteria: FilterCriteria = { location: [], properties: [] }

  get properties() {
    return this.vault.properties
  }

  /** Re-scan the temp vault from disk and refresh `notes`. */
  async scan(): Promise<ParsedNote[]> {
    this.notes = await scanVault(this.vault)
    return this.notes
  }

  /** Find a scanned note by its title. Throws if not found. */
  noteByTitle(title: string): ParsedNote {
    const note = this.notes.find((n) => n.title === title)
    if (!note) {
      throw new Error(
        `No note titled "${title}" in vault. Available: ${this.notes
          .map((n) => n.title)
          .join(', ')}`,
      )
    }
    return note
  }

  /** Re-read a single note fresh from disk (used to assert persisted, on-disk state). */
  async reread(title: string): Promise<ParsedNote> {
    const known = this.noteByTitle(title)
    const content = await readFile(known.filePath, 'utf-8')
    return parseNote(known.filePath, known.relativePath, content, TEST_VAULT_PROPERTIES)
  }
}

setWorldConstructor(ValetWorld)
