import type { FastifyPluginAsync } from 'fastify'
import { readdir, readFile } from 'fs/promises'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import yaml from 'js-yaml'
import type { DocPage } from '@shared/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, '../../../docs')
const FEATURES_DIR = join(__dirname, '../../../tests/features')
const UNIT_DIR = join(__dirname, '../../../tests/unit')
const CHANGELOG_FILE = join(__dirname, '../../../CHANGELOG.md')

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

interface DocMeta {
  title: string
  slug: string
  description?: string
}

function parseMeta(content: string): { meta: DocMeta; body: string } | null {
  const match = content.match(FRONTMATTER_RE)
  if (!match) return null
  try {
    const meta = yaml.load(match[1]) as DocMeta
    return { meta, body: match[2] }
  } catch {
    return null
  }
}

// ── Gherkin parser ────────────────────────────────────────────────────────────

interface GherkinStep { keyword: string; text: string }
interface GherkinScenario { name: string; steps: GherkinStep[] }
interface GherkinFeature { name: string; description: string; scenarios: GherkinScenario[]; file: string }

const STEP_KEYWORDS = ['Given ', 'When ', 'Then ', 'And ', 'But ']

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function parseFeatureFile(content: string, filename: string): GherkinFeature {
  const lines = content.split('\n')
  const feature: GherkinFeature = { name: '', description: '', scenarios: [], file: filename }
  let currentScenario: GherkinScenario | null = null
  const descLines: string[] = []
  let inDescription = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Feature:')) {
      feature.name = trimmed.slice('Feature:'.length).trim()
      inDescription = true
      continue
    }
    if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
      inDescription = false
      if (currentScenario) feature.scenarios.push(currentScenario)
      currentScenario = { name: trimmed.replace(/^Scenario(?: Outline)?:\s*/, ''), steps: [] }
      continue
    }
    if (currentScenario) {
      const kw = STEP_KEYWORDS.find((k) => trimmed.startsWith(k))
      if (kw) currentScenario.steps.push({ keyword: kw.trim(), text: trimmed.slice(kw.length) })
      continue
    }
    if (inDescription && trimmed) descLines.push(trimmed)
  }
  if (currentScenario) feature.scenarios.push(currentScenario)
  feature.description = descLines.join(' ')
  return feature
}

function featureToMarkdown(feature: GherkinFeature): string {
  const scenarioWord = feature.scenarios.length === 1 ? 'scenario' : 'scenarios'
  let md = `## ${feature.name}\n\n`
  if (feature.description) md += `${feature.description}\n\n`
  md += `\`${feature.file}\` · ${feature.scenarios.length} ${scenarioWord}\n\n`
  for (const scenario of feature.scenarios) {
    const steps = scenario.steps
      .map((s) => `<li><span class="tc-kw">${s.keyword}</span>${escapeHtml(s.text)}</li>`)
      .join('\n')
    md += `<details class="tc-scenario">\n<summary>${escapeHtml(scenario.name)}</summary>\n<ul>\n${steps}\n</ul>\n</details>\n\n`
  }
  return md
}

async function generateTestCasesContent(): Promise<string> {
  let files: string[]
  try {
    files = (await readdir(FEATURES_DIR)).filter((f) => f.endsWith('.feature')).sort()
  } catch {
    return '_No feature files found._\n'
  }
  const totalScenarios = { count: 0 }
  const sections: string[] = []
  for (const file of files) {
    const text = await readFile(join(FEATURES_DIR, file), 'utf-8')
    const feature = parseFeatureFile(text, `tests/features/${file}`)
    totalScenarios.count += feature.scenarios.length
    sections.push(featureToMarkdown(feature))
  }
  const header =
    `All BDD scenarios defined in \`tests/features/\`. ` +
    `See [Testing](testing) for how to run the suite and write new scenarios.\n\n` +
    `**${totalScenarios.count} scenarios** across ${files.length} feature files.\n\n---\n\n`

  // Count the unit-test files (without listing the individual tests).
  let unitCount = 0
  try {
    unitCount = (await readdir(UNIT_DIR)).filter((f) => f.endsWith('.test.ts')).length
  } catch {
    unitCount = 0
  }
  const unitSection =
    `\n\n---\n\n## Unit tests\n\n` +
    `Beyond the BDD scenarios above, the suite also includes lower-level **unit tests** ` +
    `(${unitCount} file${unitCount === 1 ? '' : 's'} in \`tests/unit/\`) covering pure logic that is ` +
    `awkward to reach through behaviour scenarios — such as property type inference, emptiness ` +
    `checks, wiki-link parsing, the settings schema, and version comparison. ` +
    `Run them with \`npm run test:unit\`.\n`

  return header + sections.join('---\n\n') + unitSection
}

// ── Doc listing ───────────────────────────────────────────────────────────────

async function listDocs(): Promise<DocPage[]> {
  const files = await readdir(DOCS_DIR)
  const pages: DocPage[] = []
  for (const file of files) {
    if (extname(file) !== '.md') continue
    const content = await readFile(join(DOCS_DIR, file), 'utf-8')
    const parsed = parseMeta(content)
    if (parsed)
      pages.push({ title: parsed.meta.title, slug: parsed.meta.slug, description: parsed.meta.description })
  }
  pages.push({ title: 'Test cases', slug: 'test-cases', description: 'All defined BDD scenarios, generated from the feature files' })
  pages.push({ title: 'Changelog', slug: 'changelog', description: "What's new in each released version" })
  const KNOWN_ORDER = ['index', 'vaults', 'operations', 'filters', 'frontmatter-types', 'git-setup', 'git-integration', 'without-git-integration', 'git-cloud-sync', 'operation-rollback', 'npm-scripts', 'testing', 'test-vault', 'test-cases', 'releases', 'changelog', 'support']
  return pages.sort((a, b) => {
    const ai = KNOWN_ORDER.indexOf(a.slug)
    const bi = KNOWN_ORDER.indexOf(b.slug)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.title.localeCompare(b.title)
  })
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const docsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/docs', async () => {
    const pages = await listDocs()
    return { data: pages }
  })

  fastify.get('/docs/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    if (!/^[\w-]+$/.test(slug)) {
      reply.code(400).send({ error: { code: 'INVALID_SLUG', message: 'Invalid slug' } })
      return
    }
    if (slug === 'test-cases') {
      const content = await generateTestCasesContent()
      return { data: { title: 'Test cases', content } }
    }
    if (slug === 'changelog') {
      try {
        const content = await readFile(CHANGELOG_FILE, 'utf-8')
        return { data: { title: 'Changelog', content } }
      } catch {
        return { data: { title: 'Changelog', content: '_No changelog found._' } }
      }
    }
    try {
      const content = await readFile(join(DOCS_DIR, `${slug}.md`), 'utf-8')
      const parsed = parseMeta(content)
      if (!parsed) {
        reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Doc not found' } })
        return
      }
      return { data: { title: parsed.meta.title, content: parsed.body } }
    } catch {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Doc not found' } })
    }
  })
}

export { listDocs }
