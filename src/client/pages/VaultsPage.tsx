import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Trash2, ChevronDown, ChevronRight, X, RefreshCw, Plus } from 'lucide-react'
import { api } from '../api/client'
import type { Vault } from '@shared/types'
import Tooltip from '../components/Tooltip'
import DirSelect from '../components/DirSelect'
import styles from './VaultsPage.module.css'

export default function VaultsPage() {
  const qc = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVaultPath, setNewVaultPath] = useState('')
  const [isBrowsing, setIsBrowsing] = useState(false)
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, Set<string>>>({})
  const [dirInputs, setDirInputs] = useState<Record<string, string>>({})
  const [deleteHoverVaultId, setDeleteHoverVaultId] = useState<string | null>(null)
  const [vaultDirs, setVaultDirs] = useState<Record<string, string[]>>({})

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
        forbiddenDirs: [],
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
        // Fetch directories when opening forbidden directories accordion
        if (section === 'forbidden' && !vaultDirs[vaultId]) {
          const vault = vaults.find((v) => v.id === vaultId)
          if (vault && vault.path) {
            ;(async () => {
              try {
                const dirs = await api.fs.listDirectories(vault.path)
                setVaultDirs((prev) => ({ ...prev, [vaultId]: dirs }))
              } catch (err) {
                setVaultDirs((prev) => ({ ...prev, [vaultId]: [] }))
              }
            })()
          }
        }
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

  function isForbiddenOrChild(dir: string, forbiddenDirs: string[]): boolean {
    return forbiddenDirs.some((forbidden) => dir === forbidden || dir.startsWith(forbidden + '/'))
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
              <Tooltip content="Browse for folder">
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                  onClick={browsePath}
                  disabled={isBrowsing}
                >
                  {isBrowsing ? '…' : <FolderOpen size={18} />}
                </button>
              </Tooltip>
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
                  <Tooltip content="Delete vault">
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => {
                        if (confirm(`Remove vault "${vault.name}"?`)) {
                          removeMutation.mutate(vault.id)
                        }
                      }}
                      disabled={removeMutation.isPending}
                      onMouseEnter={() => setDeleteHoverVaultId(vault.id)}
                      onMouseLeave={() => setDeleteHoverVaultId(null)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </Tooltip>
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
                      {isAccordionOpen(vault.id, 'forbidden') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className={styles.dirSelectWrapper}>
                        <DirSelect
                          value={dirInputs[vault.id] ?? ''}
                          onChange={(value) => {
                            const availableDirs = (vaultDirs[vault.id] ?? []).filter(
                              (d) => !isForbiddenOrChild(d, vault.forbiddenDirs),
                            )
                            if (availableDirs.includes(value) && !vault.forbiddenDirs.includes(value)) {
                              addForbiddenDir(vault.id, value)
                            } else {
                              setDirInputs((prev) => ({ ...prev, [vault.id]: value }))
                            }
                          }}
                          dirs={(vaultDirs[vault.id] ?? []).filter(
                            (d) => !isForbiddenOrChild(d, vault.forbiddenDirs),
                          )}
                          placeholder="Add directory..."
                        />
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
                      {isAccordionOpen(vault.id, 'properties') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </button>
                  {isAccordionOpen(vault.id, 'properties') && (
                    <div className={styles.accordionContent}>
                      <div className={styles.propsSectionHeader}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                          onClick={() => discoverMutation.mutate(vault.id)}
                          disabled={discoverMutation.isPending && discoverMutation.variables === vault.id}
                        >
                          <RefreshCw size={14} style={{ marginRight: '4px' }} />
                          {discoverMutation.isPending && discoverMutation.variables === vault.id
                            ? 'Scanning…'
                            : 'Refresh properties'}
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
                          No properties yet — click "Refresh properties" to scan the vault.
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
