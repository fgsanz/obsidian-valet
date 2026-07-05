import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import styles from './AnalysisPage.module.css'

/** Analysis — placeholder for upcoming functionality. */
export default function AnalysisPage() {
  const { data: activeVault } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  const { data: gitStatus } = useQuery({
    queryKey: ['git', 'status', activeVault?.id],
    queryFn: () => api.git.status(activeVault!.id),
    enabled: !!activeVault?.id,
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analysis</h1>
        {activeVault && <span className={styles.vaultName}>@{activeVault.name}</span>}
        {gitStatus &&
          (gitStatus.hasGit ? (
            <span className={styles.gitReadyPill}>Git ready</span>
          ) : (
            <span className={styles.noGit}>(no .git)</span>
          ))}
      </div>
      <p className={styles.intro}>
        This page is a placeholder for new functionality. Here are some hints of what is coming...
      </p>
      <ul className={styles.hints}>
        <li>Show paths between two notes. Path length is determined by the amount of notes in between (hops). Show the shortest path, then the 2nd shortest, the 3rd shortest and so on. Show one or more paths together in a graph, chain or list. Allow copying note names and the whole list of notes with path relative to the vault's root. Allow exporting the note names and paths.</li>
        <li>List all values used in a given property. Allow to sort. Allow to copy and export.</li>
        <li>List common values between two properties. This is very handy to spot mixed approaches of linking and tagging notes — since you probably changed your mind over time. Add option to to ignore the aliases in the note's name such as `[[Albert Einstein|Einstein]]`. Allow copy and export.</li>
      </ul>
    </div>
  )
}
