import { Link } from 'react-router-dom'
import { APP_NAME } from '@shared/constants'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <h1>{APP_NAME}</h1>
      <p>Manage and manipulate your Obsidian vault notes at the filesystem level.</p>
      <p>
        Start by adding a vault in <Link to="/vaults">Vaults</Link>, then head to{' '}
        <Link to="/ops">Operations</Link> to filter and bulk-edit notes.
      </p>
    </div>
  )
}
