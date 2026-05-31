import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Vault } from '@shared/types'
import DirPicker from '../components/DirPicker'
import styles from './VaultsPage.module.css'

// Derive vault name from the last path segment
function pathToName(path: string): string {
  return path.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? ''
}

type FormValues = {
  path: string
  name: string
  forbiddenDirs: string[]
}

const EMPTY_FORM: FormValues = {
  path: '',
  name: '',
  forbiddenDirs: ['.obsidian', '.trash'],
}

type PanelMode = 'hidden' | 'add' | { vaultId: string }

export default function VaultsPage() {
  const qc = useQueryClient()
  const [panel, setPanel] = useState<PanelMode>('hidden')
  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [availableDirs, setAvailableDirs] = useState<string[]>([])
  const [isBrowsing, setIsBrowsing] = useState(false)

  const { data: vaults = [], isError } = useQuery({
    queryKey: ['vaults'],
    queryFn: api.vaults.list,
  })

  const { data: activeVault } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['vaults'] })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Vault, 'id'>) => api.vaults.create(data),
    onSuccess: async (vault) => {
      invalidate()
      setPanel('hidden')
      // Auto-discover properties after creating the vault
      try { await api.vaults.discoverProperties(vault.id) } catch { /* non-fatal */ }
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Vault, 'id'>> }) =>
      api.vaults.update(id, data),
    onSuccess: async (vault) => {
      invalidate()
      setPanel('hidden')
      if (vault?.id) {
        try { await api.vaults.discoverProperties(vault.id) } catch { /* non-fatal */ }
        invalidate()
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: api.vaults.remove,
    onSuccess: invalidate,
  })

  const setActiveMutation = useMutation({
    mutationFn: api.vaults.setActive,
    onSuccess: invalidate,
  })

  const discoverMutation = useMutation({
    mutationFn: api.vaults.discoverProperties,
    onSuccess: invalidate,
  })

  // Reload directory list whenever the path changes
  useEffect(() => {
    const trimmed = form.path.trim()
    if (!trimmed) { setAvailableDirs([]); return }
    const timer = setTimeout(async () => {
      try {
        const dirs = await api.fs.listDirectories(trimmed)
        setAvailableDirs(dirs)
      } catch {
        setAvailableDirs([])
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.path])

  function openAdd() {
    setForm(EMPTY_FORM)
    setAvailableDirs([])
    setPanel('add')
  }

  function openEdit(vault: Vault) {
    setForm({
      path: vault.path,
      name: vault.name,
      forbiddenDirs: [...vault.forbiddenDirs],
    })
    setAvailableDirs([])
    setPanel({ vaultId: vault.id })
  }

  function updatePath(raw: string) {
    setForm((f) => ({ ...f, path: raw, name: pathToName(raw) }))
  }

  async function browsePath() {
    setIsBrowsing(true)
    try {
      const result = await api.fs.browseFolder()
      if (result?.path) updatePath(result.path)
    } finally {
      setIsBrowsing(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      path: form.path.trim(),
      forbiddenDirs: form.forbiddenDirs,
      properties: [],
    }
    if (panel === 'add') {
      createMutation.mutate(payload)
    } else if (typeof panel === 'object') {
      updateMutation.mutate({ id: panel.vaultId, data: payload })
    }
  }

  function addDir(dir: string) {
    if (!form.forbiddenDirs.includes(dir)) {
      setForm((f) => ({ ...f, forbiddenDirs: [...f.forbiddenDirs, dir] }))
    }
  }

  function removeDir(dir: string) {
    setForm((f) => ({ ...f, forbiddenDirs: f.forbiddenDirs.filter((d) => d !== dir) }))
  }

  // Only offer dirs that haven't been added yet
  const pickableDirs = availableDirs.filter((d) => !form.forbiddenDirs.includes(d))

  const isPending = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error ?? updateMutation.error

  if (isError) {
    return <div className={styles.page}><h1>Vaults</h1><p>Failed to load vaults.</p></div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vaults</h1>
        {panel === 'hidden' && (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAdd}>
            + Add vault
          </button>
        )}
      </div>

      {vaults.length === 0 && panel === 'hidden' && (
        <p className={styles.emptyState}>No vaults configured yet. Add one to get started.</p>
      )}

      {vaults.length > 0 && (
        <div className={styles.vaultList}>
          {vaults.map((vault) => {
            const isActive = vault.id === activeVault?.id
            return (
              <div key={vault.id} className={`${styles.card} ${isActive ? styles.isActive : ''}`}>
                <div className={styles.cardTop}>
                  <div className={styles.cardBody}>
                    <div className={styles.cardName}>
                      {vault.name}
                      {isActive && <span className={styles.activeBadge}>active</span>}
                    </div>
                    <div className={styles.cardPath}>{vault.path}</div>
                  </div>
                  <div className={styles.cardActions}>
                    {!isActive && (
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        onClick={() => setActiveMutation.mutate(vault.id)}
                        disabled={setActiveMutation.isPending}
                      >
                        Set active
                      </button>
                    )}
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                      onClick={() => openEdit(vault)}
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                      onClick={() => {
                        if (confirm(`Remove vault "${vault.name}"?`)) {
                          removeMutation.mutate(vault.id)
                        }
                      }}
                      disabled={removeMutation.isPending}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Auto-discovered properties table */}
                <div className={styles.propsSection}>
                  <div className={styles.propsSectionHeader}>
                    <span className={styles.propsLabel}>
                      {vault.properties.length > 0
                        ? `${vault.properties.length} propert${vault.properties.length === 1 ? 'y' : 'ies'} discovered`
                        : 'Properties not yet discovered'}
                    </span>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                      onClick={() => discoverMutation.mutate(vault.id)}
                      disabled={discoverMutation.isPending}
                    >
                      {discoverMutation.isPending && discoverMutation.variables === vault.id
                        ? '↺ Scanning…'
                        : '↺ Refresh properties'}
                    </button>
                  </div>
                  {vault.properties.length > 0 ? (
                    <div className={styles.propsGrid}>
                      {vault.properties.map((p) => (
                        <div key={p.name} className={styles.propRow}>
                          <span className={styles.propName}>{p.name}</span>
                          <span className={styles.propType}>{p.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.discoveringState}>
                      No properties yet — click ↺ Refresh properties to scan the vault.
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {panel !== 'hidden' && (
        <form className={styles.formPanel} onSubmit={handleSubmit}>
          <div className={styles.formTitle}>
            {panel === 'add' ? 'Add vault' : 'Edit vault'}
          </div>

          {/* Path (left) + Name (right, readonly) */}
          <div className={styles.pathRow}>
            <div className={styles.field}>
              <label>Vault path</label>
              <div className={styles.pathInputRow}>
                <input
                  value={form.path}
                  onChange={(e) => updatePath(e.target.value)}
                  placeholder="~/Obsidian/MyVault"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                  onClick={browsePath}
                  disabled={isBrowsing}
                  title="Browse for folder"
                >
                  {isBrowsing ? '…' : '📁'}
                </button>
              </div>
              <span className={styles.fieldHint}>Absolute path to the vault folder</span>
            </div>
            <div className={styles.field}>
              <label>Vault name</label>
              <input
                value={form.name}
                readOnly
                placeholder="MyVault"
                tabIndex={-1}
              />
              <span className={styles.fieldHint}>Auto-derived from the folder name</span>
            </div>
          </div>

          {/* Forbidden directories with autocomplete */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Forbidden directories</span>
            </div>
            <div className={styles.tagList}>
              {form.forbiddenDirs.map((dir) => (
                <span key={dir} className={styles.tag}>
                  {dir}
                  <button type="button" className={styles.tagRemove} onClick={() => removeDir(dir)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <DirPicker
                dirs={pickableDirs}
                onAdd={addDir}
                disabled={!form.path.trim()}
              />
            </div>
          </div>

          {mutationError && (
            <p className={styles.formError}>{mutationError.message}</p>
          )}

          <div className={styles.formActions}>
            {typeof panel === 'object' && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => discoverMutation.mutate(panel.vaultId)}
                disabled={discoverMutation.isPending}
                style={{ marginRight: 'auto' }}
              >
                {discoverMutation.isPending ? '↺ Scanning…' : '↺ Refresh properties'}
              </button>
            )}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setPanel('hidden')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={isPending || !form.path.trim()}
            >
              {isPending ? 'Saving…' : panel === 'add' ? 'Add vault' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
