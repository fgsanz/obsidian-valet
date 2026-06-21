import { marked } from 'marked'
import { Link } from 'react-router-dom'
import { parseChangelog } from '../lib/changelog'
import styles from './ChangelogView.module.css'

/**
 * Renders CHANGELOG.md as styled release cards (version + date, then categorised, badged change
 * groups) — an Obsidian-style changelog. Bullet items keep their inline markdown.
 */
export default function ChangelogView({ markdown }: { markdown: string }) {
  const releases = parseChangelog(markdown)

  return (
    <div className={styles.changelog}>
      <h1 className={styles.title}>Changelog</h1>

      <Link to="/docs/releases" className={styles.getLatest}>
        Get the latest release
      </Link>

      {releases.length === 0 && <p className={styles.empty}>No releases yet.</p>}

      {releases.map((release) => (
        <section key={release.version} className={styles.release}>
          <div className={styles.releaseHeader}>
            <span className={styles.version}>{release.version}</span>
            {release.date && <span className={styles.date}>{release.date}</span>}
          </div>

          {release.summary && <p className={styles.summary}>{release.summary}</p>}

          {release.groups.map((group) => (
            <div key={group.category} className={styles.group}>
              <h3 className={styles.category}>{group.category}</h3>
              <ul className={styles.items}>
                {group.items.map((item, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: marked.parseInline(item) as string }}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
