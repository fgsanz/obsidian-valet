import { useParams, NavLink, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import DocViewer from '../components/DocViewer'
import styles from './DocsPage.module.css'

function DocsIndex({ pages }: { pages: { title: string; slug: string; description?: string }[] }) {
  return (
    <div className={styles.index}>
      <h1>Obsidian Valet</h1>
      <p>Obsidian Valet is a local web tool that manipulates Obsidian vault notes at the filesystem level. It runs only when launched from the CLI and is not connected to any external service.</p>
      <h2>Sections</h2>
      <ul>
        {pages.map((p) => (
          <li key={p.slug}>
            <Link to={`/docs/${p.slug}`}>{p.title}</Link>
            {p.description && <> — {p.description}</>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DocsPage() {
  const { slug = 'index' } = useParams<{ slug?: string }>()

  const { data: pages = [] } = useQuery({
    queryKey: ['docs'],
    queryFn: api.docs.list,
    staleTime: Infinity,
  })

  const nonIndexPages = pages.filter((p) => p.slug !== 'index')

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['docs', slug],
    queryFn: () => api.docs.get(slug),
    staleTime: Infinity,
    enabled: slug !== 'index',
  })

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Documentation</div>
        <div className={styles.nav}>
          {nonIndexPages.map((p) => (
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
      </nav>

      <main className={styles.main}>
        {slug === 'index' && <DocsIndex pages={nonIndexPages} />}
        {slug !== 'index' && isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
        {slug !== 'index' && isError && <p style={{ color: 'var(--color-error)' }}>Failed to load page.</p>}
        {slug !== 'index' && page && <DocViewer content={page.content} />}
      </main>
    </div>
  )
}
