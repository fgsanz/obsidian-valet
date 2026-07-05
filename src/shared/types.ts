export type PropertyType =
  | 'text'
  | 'text-array'
  | 'number'
  | 'boolean'
  | 'date'
  | 'week-link'
  | 'tag-array'
  | 'link'
  | 'link-array'

export interface PropertyDef {
  name: string
  type: PropertyType
}

export interface Vault {
  id: string
  name: string
  path: string
  forbiddenDirs: string[]
  properties: PropertyDef[]
}

export interface AppConfig {
  version: number
  activeVaultId: string | null
  vaults: Vault[]
}

export type LocationOperator = 'all-directories' | 'directory-is' | 'directory-is-not'
export type PropertyOperator =
  | 'contains'
  | 'not-contains'
  | 'exists-and-empty'
  | 'exists-and-not-empty'
  | 'exists'
  | 'does-not-exist'

export interface LocationRule {
  operator: LocationOperator
  directory?: string
  combinator: 'and' | 'or'
}

export interface PropertyRule {
  property: string
  operator: PropertyOperator
  value?: string
  combinator: 'and' | 'or'
  caseSensitive?: boolean
}

export interface FilterCriteria {
  location: LocationRule[]
  properties: PropertyRule[]
}

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'not-equals'
  | 'not-contains'
  | 'before'
  | 'after'

export interface FilterRule {
  kind: 'property' | 'directory'
  property: string
  operator: FilterOperator
  value: string
  combinator: 'and' | 'or'
}

export type Operation =
  | { type: 'replace'; property: string; oldValue: string; newValue: string }
  | { type: 'move-value'; fromProperty: string; toProperty: string; value: string }
  | { type: 'delete-value'; property: string; value: string }
  | { type: 'add-value'; property: string; value: string }

export interface OperationError {
  filePath: string
  error: string
}

export interface OperationResult {
  matched: number
  succeeded: number
  failed: number
  errors: OperationError[]
  /** File paths of the notes that actually changed (a subset of the matched notes). */
  changedPaths: string[]
  commitSha?: string
}

export interface GitStatus {
  hasGit: boolean
  isDirty: boolean
  stagedCount: number
  unstagedCount: number
}

export interface ParsedNote {
  filePath: string
  relativePath: string
  title: string
  frontmatter: Record<string, unknown>
  rawFrontmatter: string
  body: string
}

export interface DocPage {
  title: string
  slug: string
  description?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: { code: string; message: string }
}

// ── Kindle highlights split ─────────────────────────────────────────────────

/** Metadata lifted from a Kindle-highlights note's `## Metadata` block. */
export interface KindleMetadata {
  author?: string
  asin?: string
  reference?: string
  /** The full `[Kindle link](kindle://…)` markdown, kept verbatim. */
  kindleLink?: string
}

/** A Kindle-highlights note parsed into its metadata block and one entry per highlight. */
export interface ParsedKindleNote {
  metadata: KindleMetadata
  highlights: string[]
}

/** A compact note descriptor for the split note-picker (autocomplete + Kindle detection). */
export interface NoteSummary {
  title: string
  relativePath: string
  /** Vault-relative parent directory (`''` for the vault root). */
  dir: string
  isKindle: boolean
  /** Number of highlights found when it is a Kindle note; `null` otherwise. */
  highlightsCount: number | null
}

/** A single property the user adds to every split note (name + raw string value). */
export interface KindleSplitProperty {
  name: string
  value: string
}

/** Options driving a Kindle-highlights split. Paths are vault-relative. */
export interface KindleSplitOptions {
  /** Filename prefix; each note becomes `<prefix> — <NNN>`. */
  prefix: string
  /** Counter value for the first split note (default 1). */
  startNumber: number
  /** Vault-relative target directory for the new notes. */
  targetDir: string
  /** Extra properties added to every split note's frontmatter. */
  properties: KindleSplitProperty[]
  /** Delete the original note after a successful split. */
  deleteOriginal: boolean
}

/** One generated split note (pure/in-memory — no disk path yet). */
export interface SplitNote {
  /** The counter value for this note (startNumber-based). */
  index: number
  /** Note name without extension, e.g. `… — 001`. */
  name: string
  /** Note file name, e.g. `… — 001.md`. */
  fileName: string
  /** Full file content (`---` frontmatter + body). */
  content: string
}

/** Outcome of applying a split to disk. */
export interface KindleSplitResult {
  created: number
  /** Vault-relative paths of the notes created (for a clean revert). */
  createdPaths: string[]
  originalDeleted: boolean
}
