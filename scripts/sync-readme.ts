/**
 * Feeds sections of README.md from the docs as the single source of truth.
 *
 * For each entry in SECTIONS, the doc's body (frontmatter and leading H1 stripped) is injected
 * into README.md between the matching `<!-- BEGIN GENERATED: <id> ... -->` and
 * `<!-- END GENERATED: <id> -->` markers. Edit the doc, not the README.
 *
 * Run with: npm run sync-readme   (use `--check` in CI to fail when README is stale)
 */
import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const README = join(ROOT, 'README.md')

// id (used in the README markers) → doc file the section is fed from.
const SECTIONS: { id: string; doc: string }[] = [
  { id: 'configuration', doc: 'docs/configuration.md' },
]

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/

/** Strip frontmatter and a single leading `# Heading`, returning the trimmed body. */
function docBody(raw: string): string {
  return raw.replace(FRONTMATTER_RE, '').trimStart().replace(/^#\s+.+\r?\n+/, '').trim()
}

async function main() {
  const check = process.argv.includes('--check')
  let readme = await readFile(README, 'utf-8')
  let stale = false

  for (const { id, doc } of SECTIONS) {
    const body = docBody(await readFile(join(ROOT, doc), 'utf-8'))
    const re = new RegExp(
      `(<!-- BEGIN GENERATED: ${id}[^>]*-->\\n)[\\s\\S]*?(\\n<!-- END GENERATED: ${id} -->)`,
    )
    if (!re.test(readme)) {
      console.error(`  Missing markers for "${id}" in README.md`)
      process.exit(1)
    }
    const next = readme.replace(re, `$1${body}$2`)
    if (next !== readme) stale = true
    readme = next
  }

  if (check) {
    if (stale) {
      console.error('  README.md is out of date. Run: npm run sync-readme')
      process.exit(1)
    }
    console.log('  README.md is in sync with the docs.')
    return
  }

  await writeFile(README, readme)
  console.log('  README.md synced from docs.')
}

main()
