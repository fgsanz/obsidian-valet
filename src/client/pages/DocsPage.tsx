import { useEffect, useState } from 'react'
import { useParams, NavLink, Link } from 'react-router-dom'
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
  { title: 'Usage', slugs: ['getting-started', 'vaults', 'metadata-filters', 'metadata-operations', 'frontmatter-types', 'kindle-highlights-split', 'upgrading'] },
  { title: 'Pro usage', slugs: ['obsidian-scenarios', 'git-integration', 'without-git-integration', 'git-setup', 'git-cloud-storage', 'operation-rollback'] },
  { title: 'Development', slugs: ['npm-scripts', 'testing', 'test-vault', 'test-cases', 'configuration'] },
  { title: 'Releases', slugs: ['releases', 'changelog', 'whats-next'] },
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

const METADATA_USE_CASES: { text: React.ReactNode; author: string }[] = [
  {
    author: 'Björn',
    text: (
      <>Find notes <strong>in directory</strong> ‘Notes/Raw’ and <strong>add</strong> ‘#review’ to <code>tags</code> property</>
    ),
  },
  {
    author: 'Aiko',
    text: (
      <>Find notes where <code>tags</code> contains ‘#physics’ and <strong>move</strong> ‘[[STEM]]’ from <code>related</code> to <code>parent</code> property</>
    ),
  },
  {
    author: 'Tomás',
    text: (
      <>Find notes where ´[[Woodworking]]´ <strong>is in either</strong> <code>parent</code> or <code>related</code> properties, and add the tag ‘#diy’ to <code>tags</code> property</>
    ),
  },
  {
    author: 'Aless',
    text: (
      <>Find notes where <code>tags</code> contains ‘#physics’ and <code>parent</code> <strong>exists and does not contain</strong> ‘[[STEM]]’, and add ‘[[STEM]]’ to <code>parent</code> property</>
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

const CONTENT_USE_CASES: { text: React.ReactNode; author: string }[] = [
  {
    author: 'Björn',
    text: (
      <>Split the note "Sapiens - Kindle highlights" into individual notes. Carry the original metadata to the split notes. Add ´#literary´ to <code>tags</code> property. Add a link to the original note in <code>parent</code> property. Add the links ´[[Civilization]]´,´[[Human]]´,´[[Evolution]]´ and ´[[Anthropology]]´ to <code>related</code> property ... Later I will carefully review and link each note further.</>
    ),
  }
]

const ANALYSIS_USE_CASES: { text: React.ReactNode; author: string }[] = [
  {
    author: 'Björn',
    text: (
      <>Show <strong>the shortest path</strong> between two notes. Then the next-shortest, and so on.</>
    ),
  },
  {
    author: 'Aiko',
    text: (
      <>List <strong>all values used</strong> by a given property.</>
    ),
  },
  {
    author: 'Tomás',
    text: (
      <>Find <strong>all values shared</strong> by two properties.</>
    ),
  }
]

// The example use-cases are grouped by the area of the tool they exercise. Each tab shows a short
// intro and its own set of example cards.
const USE_CASE_TABS: { id: string; label: string; description: React.ReactNode; cases: typeof METADATA_USE_CASES }[] = [
  {
    id: 'metadata',
    label: 'Metadata',
    description: (
      <>Filter notes by paths and/or properties, and perform bulk operations to <strong>delete</strong>, <strong>replace</strong>, <strong>move</strong> and <strong>add</strong> metadata values. This happens completely offline and does not connect to any external service. Examples that accomodate to different tagging and linking styles:</>
    ),
    cases: METADATA_USE_CASES,
  },
  {
    id: 'content',
    label: 'Content',
    description: (
      <>The functionality{' '}
        <Link to="/docs/kindle-highlights-split">Kindle highlights split</Link> turns a single note made by the{' '}
        <a href="https://community.obsidian.md/plugins/obsidian-kindle-plugin" target="_blank" rel="noreferrer">
          Kindle Highlights
        </a>{' '}
        community plugin — containing all the highlights of a book — into multiple notes carrying a single highlight per note, so each idea can be linked across different topics and delivers far more meaningful AI RAG embeddings.
      </>
    ),
    cases: CONTENT_USE_CASES,
  },
  {
    id: 'analysis',
    label: 'Analysis',
    description: (
      <>Analysis features are <strong>coming soon.</strong> They will expose structure and relationships across your vault, helping you identify suboptimal or outdated note-taking habits built up over time.</>
    ),
    cases: ANALYSIS_USE_CASES,
  },
]

function DocsIndex() {
  const [tab, setTab] = useState(USE_CASE_TABS[0].id)
  const active = USE_CASE_TABS.find((t) => t.id === tab) ?? USE_CASE_TABS[0]
  return (
    <div className={styles.index}>
      <h1>Obsidian Valet</h1>
      <p>Obsidian Valet is a local web tool that manipulates Obsidian vault notes at the filesystem level. Check out <Link to="/docs/getting-started">Getting started</Link></p>
      <h2>Functionality examples</h2>
      <div className={styles.tabs}>
        {USE_CASE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.activeTab : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p>{active.description}</p>
      <div className={styles.examplesGrid}>
        {active.cases.map((u, i) => (
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

  // When navigating to a doc, expand the section that contains it so the active item is visible —
  // e.g. clicking "Support" in the top nav opens the Support section. Other sections keep their
  // current expanded/collapsed state. Runs on slug change only, so the user can still collapse it.
  useEffect(() => {
    const section = DOC_SECTIONS.find((s) => s.slugs.includes(slug))
    if (!section) return
    setCollapsed((prev) => {
      if (!prev.has(section.title)) return prev
      const next = new Set(prev)
      next.delete(section.title)
      return next
    })
  }, [slug])

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
