import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import styles from './VaultPicker.module.css'

export default function VaultPicker() {
  const qc = useQueryClient()

  const { data: vaults = [] } = useQuery({
    queryKey: ['vaults'],
    queryFn: api.vaults.list,
  })

  const { data: activeVault } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  const setActiveMutation = useMutation({
    mutationFn: api.vaults.setActive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vaults'] }),
  })

  if (vaults.length === 0) {
    return (
      <span className={styles.noVault}>
        No vault —{' '}
        <Link to="/vaults" className={styles.noVaultLink}>
          add one
        </Link>
      </span>
    )
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Active vault</span>
      <select
        className={styles.select}
        value={activeVault?.id ?? ''}
        onChange={(e) => {
          if (e.target.value) setActiveMutation.mutate(e.target.value)
        }}
      >
        {!activeVault && <option value="">— select —</option>}
        {vaults.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  )
}
