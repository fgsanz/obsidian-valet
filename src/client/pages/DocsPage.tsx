import { useEffect, useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { DocPage } from '@shared/types'
import { api } from '../api/client'
import DocViewer from '../components/DocViewer'
import ChangelogView from '../components/ChangelogView'
import Tooltip from './../components/Tooltip'
import styles from './DocsPage.module.css'

/**
 * Documentation sections for the left nav, in display order. Each lists its docs by slug, also in
 * order. A doc not listed here falls into an "Other" section at the end — when adding a new doc,
 * decide which section it belongs to and add its slug here.
 */
const DOC_SECTIONS: { title: string; slugs: string[] }[] = [
  { title: 'Usage', slugs: ['getting-started', 'vaults', 'filters', 'operations', 'frontmatter-types'] },
  { title: 'Pro usage', slugs: ['obsidian-scenarios', 'git-integration', 'without-git-integration', 'git-setup', 'git-cloud-storage', 'operation-rollback'] },
  { title: 'Development', slugs: ['npm-scripts', 'testing', 'test-vault', 'test-cases'] },
  { title: 'Releases', slugs: ['releases', 'changelog'] },
  { title: 'Support', slugs: ['support'] },
]

// By default every section starts collapsed except "Usage".
const DEFAULT_COLLAPSED = new Set(DOC_SECTIONS.filter((s) => s.title !== 'Usage').map((s) => s.title))

// Remember the expand/collapse state for the current session only (not persisted to settings), so
// it survives navigating away from Docs and back without resetting to the default.
let sessionCollapsed: Set<string> | null = null

function groupIntoSections(pages: DocPage[]): { title: string; docs: DocPage[] }[] {
  const bySlug = new Map(pages.map((p) => [p.slug, p]))
  const placed = new Set<string>()
  const sections = DOC_SECTIONS.map((section) => {
    const docs: DocPage[] = []
    for (const slug of section.slugs) {
      const page = bySlug.get(slug)
      if (page) {
        docs.push(page)
        placed.add(slug)
      }
    }
    return { title: section.title, docs }
  }).filter((s) => s.docs.length > 0)

  const others = pages.filter((p) => !placed.has(p.slug))
  return others.length ? [...sections, { title: 'Other', docs: others }] : sections
}

const USE_CASES: { text: React.ReactNode; author: string }[] = [
  {
    author: 'Björn',
    text: (
      <>Find notes <strong>in directory</strong> ‘Notes/Raw’ and <strong>add</strong> ‘review’ to <code>tags</code> property</>
    ),
  },
  {
    author: 'Aiko',
    text: (
      <>Find notes where <code>tags</code> contains ‘physics’ and <strong>move</strong> ‘[[STEM]]’ from <code>related</code> to <code>parent</code></>
    ),
  },
  {
    author: 'Tomás',
    text: (
      <>Find notes where ´[[Woodworking]]´ <strong>is in either</strong> <code>parent</code> or <code>related</code> properties, and add the tag ‘diy’ to <code>tags</code> property</>
    ),
  },
  {
    author: 'Aless',
    text: (
      <>Find notes where <code>tags</code> contains ‘physics’ and <code>parent</code> <strong>exists and does not contain</strong> ‘[[STEM]]’, and add ‘[[STEM]]’ to <code>parent</code> property</>
    ),
  },
  {
    author: 'Yuki',
    text: (
      <>Find all notes <strong>not in directory</strong> ‘Work’ where property <code>parent</code> contains ´[[sw dev]]´, and <strong>replace</strong> ‘[[sw dev]]’ with ‘[[Coding]]’</>
    ),
  },
  {
    author: 'Priya',
    text: (
      <>Find notes in directory ‘Books’ where <code>date</code> property <strong>exist and is empty</strong>, and <strong>delete</strong> ´true´ from <code>read</code> property</>
    ),
  },
]

function DocsIndex() {
  return (
    <div className={styles.index}>
      <h1>Obsidian Valet</h1>
      <p>Obsidian Valet is a local web tool that manipulates Obsidian vault notes at the filesystem level.</p>
      <p>The tool filters notes by paths and/or properties, and performs operations such as <strong>delete</strong>, <strong>replace</strong>, <strong>move</strong> and <strong>add</strong> value. It runs completely offline and does not connect to any external service.</p>
      <h2>Use cases – Examples</h2>
      <div className={styles.examplesGrid}>
        {USE_CASES.map((u, i) => (
          <div key={i} className={styles.exampleCard}>
            {u.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DocsPage() {
  const { slug = 'index' } = useParams<{ slug?: string }>()
  // Restore this session's collapse state, or start with everything collapsed but "Usage".
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(sessionCollapsed ?? DEFAULT_COLLAPSED),
  )

  // Keep the session memory in sync so it persists across leaving and returning to Docs.
  useEffect(() => {
    sessionCollapsed = collapsed
  }, [collapsed])

  const { data: pages = [] } = useQuery({
    queryKey: ['docs'],
    queryFn: api.docs.list,
    staleTime: Infinity,
  })

  const nonIndexPages = pages.filter((p) => p.slug !== 'index')
  const sections = groupIntoSections(nonIndexPages)
  const allExpanded = sections.length > 0 && sections.every((s) => !collapsed.has(s.title))

  function toggleSection(title: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  function toggleAll() {
    setCollapsed(allExpanded ? new Set(sections.map((s) => s.title)) : new Set())
  }

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['docs', slug],
    queryFn: () => api.docs.get(slug),
    staleTime: Infinity,
    enabled: slug !== 'index',
  })

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>Documentation</span>
          <Tooltip content={allExpanded ? 'Collapse all' : 'Expand all'}>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={toggleAll}
              aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
            >
              {allExpanded ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
            </button>
          </Tooltip>
        </div>

        {sections.map((section) => {
          const open = !collapsed.has(section.title)
          return (
            <div key={section.title} className={styles.section}>
              <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => toggleSection(section.title)}
                aria-expanded={open}
              >
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{section.title}</span>
              </button>
              {open && (
                <div className={styles.sectionDocs}>
                  {section.docs.map((p) => (
                    <NavLink
                      key={p.slug}
                      to={`/docs/${p.slug}`}
                      className={({ isActive }) =>
                        `${styles.navLink} ${isActive ? styles.active : ''}`
                      }
                    >
                      {p.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <main className={styles.main}>
        {slug === 'index' && <DocsIndex />}
        {slug !== 'index' && isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
        {slug !== 'index' && isError && <p style={{ color: 'var(--color-error)' }}>Failed to load page.</p>}
        {slug !== 'index' && page && slug === 'changelog' && <ChangelogView markdown={page.content} />}
        {slug !== 'index' && page && slug !== 'changelog' && <DocViewer content={page.content} />}
      </main>
    </div>
  )
}
