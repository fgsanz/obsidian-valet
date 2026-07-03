import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import styles from './PlaceholderPage.module.css'

/** A simple "coming soon" page used for menu entries whose functionality isn't built yet. */
export default function PlaceholderPage({ title }: { title: string }) {
  const { data: activeVault } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {activeVault && <span className={styles.vaultName}>@{activeVault.name}</span>}
      </div>
      <p className={styles.intro}>
        This page is a placeholder for new functionality. Here are some hints of what is coming...
      </p>
      <ul className={styles.hints}>
        <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
        <li>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li>
        <li>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.</li>
      </ul>
    </div>
  )
}
