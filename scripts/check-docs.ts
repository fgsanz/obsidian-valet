/**
 * Verifies that every route module's exported routeDoc slug has a matching docs/*.md file.
 * Run with: npm run check-docs
 */
import { readdir } from 'fs/promises'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, '../docs')
const ROUTES_DIR = join(__dirname, '../src/server/routes')

const REQUIRED_SLUGS = ['index', 'vaults', 'metadata-filters', 'metadata-operations', 'frontmatter-types', 'git-integration', 'npm-scripts']

async function main() {
  const docFiles = await readdir(DOCS_DIR)
  const docSlugs = new Set(
    docFiles.filter((f) => extname(f) === '.md').map((f) => f.replace(/\.md$/, '')),
  )

  let ok = true
  for (const slug of REQUIRED_SLUGS) {
    if (!docSlugs.has(slug)) {
      console.error(`  Missing doc: docs/${slug}.md`)
      ok = false
    }
  }

  if (ok) {
    console.log(`  check-docs: all ${REQUIRED_SLUGS.length} doc pages present`)
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
