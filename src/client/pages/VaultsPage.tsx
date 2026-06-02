import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Vault } from '@shared/types'
import styles from './VaultsPage.module.css'

export default function VaultsPage() {
  const qc = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVaultPath, setNewVaultPath] = useState('')
  const [isBrowsing, setIsBrowsing] = useState(false)
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, Set<string>>>({})
  const [dirInputs, setDirInputs] = useState<Record<string, string>>({})
  const [deleteHoverVaultId, setDeleteHoverVaultId] = useState<string | null>(null)

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
    mutationFn: async (path: string) => {
      const name = path.replace(/\/$/, '').split('/').filter(Boolean).pop() ?? ''
      const vault = await api.vaults.create({
        name,
        path,
        forbiddenDirs: ['.obsidian', '.trash'],
        properties: [],
      })
      try { await api.vaults.discoverProperties(vault.id) } catch { /* non-fatal */ }
      return vault
    },
    onSuccess: () => {
      invalidate()
      setShowAddForm(false)
      setNewVaultPath('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: api.vaults.remove,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Vault, 'id'>> }) =>
      api.vaults.update(id, data),
    onSuccess: invalidate,
  })

  const discoverMutation = useMutation({
    mutationFn: api.vaults.discoverProperties,
    onSuccess: invalidate,
  })

  function toggleAccordion(vaultId: string, section: string) {
    setExpandedAccordions((prev) => {
      const vaultSet = new Set(prev[vaultId] ?? [])
      if (vaultSet.has(section)) {
        vaultSet.delete(section)
      } else {
        vaultSet.add(section)
      }
      return { ...prev, [vaultId]: vaultSet }
    })
  }

  function isAccordionOpen(vaultId: string, section: string): boolean {
    return (expandedAccordions[vaultId] ?? new Set()).has(section)
  }

  function addForbiddenDir(vaultId: string, dir: string) {
    const vault = vaults.find((v) => v.id === vaultId)
    if (vault && !vault.forbiddenDirs.includes(dir)) {
      updateMutation.mutate({
        id: vaultId,
        data: { forbiddenDirs: [...vault.forbiddenDirs, dir] },
      })
      setDirInputs((prev) => ({ ...prev, [vaultId]: '' }))
    }
  }

  function removeForbiddenDir(vaultId: string, dir: string) {
    const vault = vaults.find((v) => v.id === vaultId)
    if (vault) {
      updateMutation.mutate({
        id: vaultId,
        data: { forbiddenDirs: vault.forbiddenDirs.filter((d) => d !== dir) },
      })
    }
  }

  async function browsePath() {
    setIsBrowsing(true)
    try {
      const result = await api.fs.browseFolder()
      if (result?.path) setNewVaultPath(result.path)
    } finally {
      setIsBrowsing(false)
    }
  }

  async function handleAddVault() {
    if (newVaultPath.trim()) {
      createMutation.mutate(newVaultPath.trim())
    }
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <h1>Vaults</h1>
        <p>Failed to load vaults.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vaults</h1>
        {!showAddForm && (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowAddForm(true)}>
            + Add vault
          </button>
        )}
      </div>

      {vaults.length === 0 && !showAddForm && (
        <p className={styles.emptyState}>No vaults configured yet. Add one to get started.</p>
      )}

      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.addFormTitle}>Add vault</div>
          <div className={styles.field}>
            <label>Vault path</label>
            <div className={styles.pathInputRow}>
              <input
                value={newVaultPath}
                onChange={(e) => setNewVaultPath(e.target.value)}
                placeholder="~/Obsidian/MyVault"
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
          </div>
          <div className={styles.addFormActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setShowAddForm(false)
                setNewVaultPath('')
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleAddVault}
              disabled={createMutation.isPending || !newVaultPath.trim()}
            >
              {createMutation.isPending ? 'Adding…' : 'Add vault'}
            </button>
          </div>
        </div>
      )}

      {vaults.length > 0 && (
        <div className={styles.vaultList}>
          {vaults.map((vault) => {
            const isActive = vault.id === activeVault?.id

            return (
              <div
                key={vault.id}
                className={`${styles.vaultCard} ${deleteHoverVaultId === vault.id ? styles.hasDeleteHover : ''}`}
              >
                <div className={styles.vaultCardHeader}>
                  <div className={styles.vaultCardTitle}>
                    <span className={styles.vaultName}>{vault.name}</span>
                    {isActive && <span className={styles.activeBadge}>Active</span>}
                  </div>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => {
                      if (confirm(`Remove vault "${vault.name}"?`)) {
                        removeMutation.mutate(vault.id)
                      }
                    }}
                    title="Delete vault"
                    disabled={removeMutation.isPending}
                    onMouseEnter={() => setDeleteHoverVaultId(vault.id)}
                    onMouseLeave={() => setDeleteHoverVaultId(null)}
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.vaultPath}>{vault.path}</div>

                {/* Forbidden Directories Accordion */}
                <div className={styles.accordion}>
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleAccordion(vault.id, 'forbidden')}
                  >
                    <span className={styles.accordionTitle}>Forbidden directories</span>
                    <span className={styles.accordionIcon}>
                      {isAccordionOpen(vault.id, 'forbidden') ? '▼' : '▶'}
                    </span>
                  </button>
                  {isAccordionOpen(vault.id, 'forbidden') && (
                    <div className={styles.accordionContent}>
                      <div className={styles.tagList}>
                        {vault.forbiddenDirs.map((dir) => (
                          <span key={dir} className={styles.tag}>
                            {dir}
                            <button
                              type="button"
                              className={styles.tagRemove}
                              onClick={() => removeForbiddenDir(vault.id, dir)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className={styles.dirSelectWrapper}>
                        <div className={styles.dirInput}>
                          <input
                            type="text"
                            value={dirInputs[vault.id] ?? ''}
                            onChange={(e) =>
                              setDirInputs((prev) => ({ ...prev, [vault.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = dirInputs[vault.id]?.trim()
                                if (value && !vault.forbiddenDirs.includes(value)) {
                                  addForbiddenDir(vault.id, value)
                                }
                              }
                            }}
                            placeholder="Type directory name and press Enter"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Properties Accordion */}
                <div className={styles.accordion}>
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleAccordion(vault.id, 'properties')}
                  >
                    <span className={styles.accordionTitle}>
                      Properties
                      {vault.properties.length > 0 && (
                        <span className={styles.propertyCount}>{vault.properties.length}</span>
                      )}
                    </span>
                    <span className={styles.accordionIcon}>
                      {isAccordionOpen(vault.id, 'properties') ? '▼' : '▶'}
                    </span>
                  </button>
                  {isAccordionOpen(vault.id, 'properties') && (
                    <div className={styles.accordionContent}>
                      <div className={styles.propsSectionHeader}>
                        <span className={styles.propsLabel}>
                          {vault.properties.length > 0
                            ? `${vault.properties.length} propert${vault.properties.length === 1 ? 'y' : 'ies'} discovered`
                            : 'Properties not yet discovered'}
                        </span>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                          onClick={() => discoverMutation.mutate(vault.id)}
                          disabled={discoverMutation.isPending && discoverMutation.variables === vault.id}
                        >
                          {discoverMutation.isPending && discoverMutation.variables === vault.id
                            ? '↺ Scanning…'
                            : '↺ Refresh properties'}
                        </button>
                      </div>
                      {vault.properties.length > 0 ? (
                        <div className={styles.propsGrid}>
                          {[...vault.properties]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((p) => (
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
