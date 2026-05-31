import type { FastifyPluginAsync } from 'fastify'
import { readdir, readFile } from 'fs/promises'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import yaml from 'js-yaml'
import type { DocPage } from '@shared/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, '../../../docs')

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

interface DocMeta {
  title: string
  slug: string
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

async function listDocs(): Promise<DocPage[]> {
  const files = await readdir(DOCS_DIR)
  const pages: DocPage[] = []
  for (const file of files) {
    if (extname(file) !== '.md') continue
    const content = await readFile(join(DOCS_DIR, file), 'utf-8')
    const parsed = parseMeta(content)
    if (parsed) pages.push({ title: parsed.meta.title, slug: parsed.meta.slug })
  }
  const ORDER = ['index', 'vaults', 'operations', 'filters', 'frontmatter-types', 'git-integration']
  return pages.sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))
}

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
