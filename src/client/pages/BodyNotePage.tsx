import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import styles from './BodyNotePage.module.css'

/** Body note — placeholder for upcoming functionality. */
export default function BodyNotePage() {
  const { data: activeVault } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Body note</h1>
        {activeVault && <span className={styles.vaultName}>@{activeVault.name}</span>}
      </div>
      <p className={styles.intro}>
        This page is a placeholder for new functionality. Here are some hints of what is coming...
      </p>
      <ul className={styles.hints}>
        <li>Split a single "Kindle highlights" into multiple notes. Motivation: A note containing all snippets of a whole book is against good practices smart note taking; we want atomic, independent and self-contained notes; atomic notes will unleash the connectivity of a single snippet, and if you are using RAG embeddings your notes will much more meaningful. So... Convert a single note made by the Obsidian plugin “Kindle highlights” into multiple notes. Allow defining properties and setting up values. Allow defining filename pattern for the new notes. Option to keep the original note. Maybe for this feature it would be useful to use templates already defined in the vault — to apply a template when splitting notes. Only allow adding properties which are already defined in the vault, to leverage format validation when dealing with property values.</li>
        <li>Split a single note with clip notes from "Audible" (audio book platform) into multi notes. Motivation: same reasoning than the splitting of "Kindle highlights" notes. Take default format from the Audible website (instruct users how to do it). Same capabilities than the splitting of "Kindle highlights".</li>
      </ul>
    </div>
  )
}
