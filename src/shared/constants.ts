export const APP_NAME = 'Obsidian Valet'
export const APP_NAME_SLUG = 'obsidian-valet'
export const APP_VERSION = '0.1.0'
export const GITHUB_REPO = 'fgsanz/obsidian-valet'

export const PROPERTY_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'text-array', label: 'Text list' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date (YYYY-MM-DD)' },
  { value: 'week-link', label: 'Week link ([[YYYY-Www]])' },
  { value: 'tag-array', label: 'Tag list' },
  { value: 'link', label: 'Note link' },
  { value: 'link-array', label: 'Note link list' },
] as const satisfies ReadonlyArray<{ value: string; label: string }>
