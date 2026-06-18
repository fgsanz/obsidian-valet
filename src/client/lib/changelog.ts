/**
 * A change category within a release (e.g. "Added", "Fixed"), with its bullet items. Items keep
 * their inline markdown (`**bold**`, `` `code` ``, links) so the view can render it.
 */
export interface ChangeGroup {
  category: string
  items: string[]
}

export interface ChangelogRelease {
  version: string
  date: string | null
  /** Free text after the version heading and before the first category (e.g. "First public release."). */
  summary: string
  groups: ChangeGroup[]
}

const VERSION_RE = /^##\s+\[?([^\]\s]+)\]?(?:\s*[-–—]\s*(.+))?$/
const CATEGORY_RE = /^###\s+(.+)$/
const LINKREF_RE = /^\[[^\]]+\]:\s+\S+/
const ITEM_RE = /^[-*]\s+(.+)$/

/**
 * Parse a Keep-a-Changelog style `CHANGELOG.md` into structured releases for the changelog view.
 * Preamble (the top `# Changelog` + intro), link-reference lines, and the footer after a `---`
 * separator are ignored. Wrapped bullet lines are joined back into a single item.
 */
export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = []
  let current: ChangelogRelease | null = null
  let group: ChangeGroup | null = null
  let ended = false
  let summary: string[] = []

  const flushSummary = () => {
    if (current && summary.length) current.summary = summary.join(' ').trim()
    summary = []
  }

  for (const raw of markdown.split('\n')) {
    const line = raw.trim()

    const version = line.match(VERSION_RE)
    if (version) {
      flushSummary()
      current = { version: version[1], date: version[2]?.trim() || null, summary: '', groups: [] }
      releases.push(current)
      group = null
      ended = false
      continue
    }

    if (!current || ended) continue // preamble, or footer after the trailing `---`
    if (line === '---') {
      flushSummary()
      ended = true
      continue
    }
    if (!line || LINKREF_RE.test(line)) continue

    const category = line.match(CATEGORY_RE)
    if (category) {
      flushSummary()
      group = { category: category[1].trim(), items: [] }
      current.groups.push(group)
      continue
    }

    const item = line.match(ITEM_RE)
    if (item) {
      if (group) group.items.push(item[1].trim())
      else summary.push(item[1].trim())
      continue
    }

    // A wrapped continuation of the previous bullet, otherwise summary text.
    if (group && group.items.length) {
      group.items[group.items.length - 1] += ' ' + line
    } else {
      summary.push(line)
    }
  }

  flushSummary()
  return releases
}
