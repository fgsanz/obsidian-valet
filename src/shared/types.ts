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
export type PropertyOperator = 'contains' | 'not-contains' | 'exists-and-empty' | 'does-not-exist'

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
