import { Link } from 'react-router-dom'
import { APP_NAME } from '@shared/constants'
import logoDark from '../assets/logo-dark.svg'
import logoLight from '../assets/logo-light.svg'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        {/* The dark logo (white wordmark) shows on the dark theme; the light one on the light
            theme. Both are rendered and toggled via CSS so the right one paints immediately. */}
        <img src={logoLight} alt={APP_NAME} className={`${styles.logo} ${styles.logoLight}`} />
        <img src={logoDark} alt={APP_NAME} className={`${styles.logo} ${styles.logoDark}`} />
      </div>

      <p className={styles.description}>
        Manipulate the metadata of your Obsidian vault notes.
        <br />
        Add a vault in <Link to="/vaults">Vaults</Link>, then head to{' '}
        <Link to="/ops">Operations</Link> to filter and bulk-edit notes.
      </p>
    </div>
  )
}
