import { useParams, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import DocViewer from '../components/DocViewer'
import styles from './DocsPage.module.css'

export default function DocsPage() {
  const { slug = 'index' } = useParams<{ slug?: string }>()

  const { data: pages = [] } = useQuery({
    queryKey: ['docs'],
    queryFn: api.docs.list,
    staleTime: Infinity,
  })

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['docs', slug],
    queryFn: () => api.docs.get(slug),
    staleTime: Infinity,
  })

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Documentation</div>
        <div className={styles.nav}>
          {pages.filter((p) => p.slug !== 'index').map((p) => (
            <NavLink
              key={p.slug}
              to={p.slug === 'index' ? '/docs' : `/docs/${p.slug}`}
              end={p.slug === 'index'}
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
        {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
        {isError && <p style={{ color: 'var(--color-error)' }}>Failed to load page.</p>}
        {page && <DocViewer content={page.content} />}
      </main>
    </div>
  )
}
