import { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import type { DocPage } from '@shared/types'
import { api } from '../api/client'
import DocViewer from '../components/DocViewer'
import Tooltip from './../components/Tooltip'
import styles from './DocsPage.module.css'

/**
 * Documentation sections for the left nav, in display order. Each lists its docs by slug, also in
 * order. A doc not listed here falls into an "Other" section at the end — when adding a new doc,
 * decide which section it belongs to and add its slug here.
 */
const DOC_SECTIONS: { title: string; slugs: string[] }[] = [
  { title: 'Usage', slugs: ['vaults', 'filters', 'operations', 'frontmatter-types'] },
  { title: 'Pro usage', slugs: ['git-integration', 'without-git-integration', 'git-setup', 'operation-rollback'] },
  { title: 'Development', slugs: ['npm-scripts', 'testing', 'test-vault', 'test-cases'] },
  { title: 'Releases', slugs: ['releases', 'changelog'] },
]

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
      <>Find notes <strong>in directory</strong> ‘Notes/Raw’ and <strong>add</strong> ‘review’ to ‘tags´ property</>
    ),
  },
  {
    author: 'Aiko',
    text: (
      <>Find notes where ‘tags’ contains ‘physics’ and <strong>move</strong> ‘[[STEM]]’ <strong>from</strong> ‘related’ to ‘parent’</>
    ),
  },
  {
    author: 'Tomás',
    text: (
      <>Find notes where ´[[Woodworking]]´ <strong>is in either</strong> ‘parent’ or ‘related’ properties, and add the tag ‘diy’ to ‘tags’ property</>
    ),
  },
  {
    author: 'Aless',
    text: (
      <>Find notes where ‘tags’ contains ‘physics’ and ‘parent’ <strong>exists and does not contain</strong> ‘[[STEM]]’, and add ‘[[STEM]]’ to ‘parent’ property</>
    ),
  },
  {
    author: 'Yuki',
    text: (
      <>Find all notes <strong>not in directory</strong> ‘Work’ where property ‘parent’ contains ´[[sw dev]]´, and <strong>replace</strong> ‘[[sw dev]]’ <strong>with</strong> ‘[[Coding]]’</>
    ),
  },
  {
    author: 'Priya',
    text: (
      <>Find notes in directory ‘Books’ where property ‘date’ <strong>exist and is empty</strong>, and <strong>delete</strong> ´true´ from ´read´ property</>
    ),
  },
]

function DocsIndex() {
  return (
    <div className={styles.index}>
      <h1>Obsidian Valet</h1>
      <p>Obsidian Valet is a local web tool that manipulates Obsidian vault notes at the filesystem level. It runs only when launched from the CLI and is not connected to any external service.</p>
      <h2>Use cases – Examples</h2>
      <div className={styles.examplesGrid}>
        {USE_CASES.map((u, i) => (
          <div key={i} className={styles.exampleCard}>
            {u.text} <span className={styles.exampleAuthor}>— {u.author}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DocsPage() {
  const { slug = 'index' } = useParams<{ slug?: string }>()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

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
        {slug !== 'index' && page && <DocViewer content={page.content} />}
      </main>
    </div>
  )
}
