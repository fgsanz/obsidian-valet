import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { FilterCriteria, Operation, ParsedNote, OperationResult } from '@shared/types'
import FilterBuilder from '../components/FilterBuilder'
import NoteList from '../components/NoteList'
import StatsBar from '../components/StatsBar'
import BulkOpPanel from '../components/BulkOpPanel'
import GitCommitModal from '../components/GitCommitModal'
import { APP_NAME } from '@shared/constants'
import styles from './OperationsPage.module.css'

type Tab = 'filter' | 'ops'
type GitModalState = { purpose: 'pre' | 'post'; defaultMsg: string } | null

export default function OperationsPage() {
  const { data: activeVault, isLoading } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })

  const { data: gitStatus } = useQuery({
    queryKey: ['git', 'status', activeVault?.id],
    queryFn: () => api.git.status(activeVault!.id),
    enabled: !!activeVault?.id,
  })

  const { data: dirs = [] } = useQuery({
    queryKey: ['vault', 'directories', activeVault?.id],
    queryFn: () => api.vaults.directories(activeVault!.id),
    enabled: !!activeVault?.id,
  })

  const [activeTab, setActiveTab] = useState<Tab>('filter')

  const [criteria, setCriteria] = useState<FilterCriteria>({
    location: [{ operator: 'all-directories', combinator: 'and' }],
    properties: [{ property: '', operator: 'contains', combinator: 'and' }],
  })
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [matchedNotes, setMatchedNotes] = useState<ParsedNote[] | null>(null)

  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewNotes, setPreviewNotes] = useState<ParsedNote[] | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [result, setResult] = useState<OperationResult | null>(null)
  const [gitModal, setGitModal] = useState<GitModalState>(null)
  const [pendingOperation, setPendingOperation] = useState<Operation | null>(null)
  const [gitCommitted, setGitCommitted] = useState(false)

  function reset() {
    setMatchedNotes(null)
    setResult(null)
    setPreviewNotes(null)
    setPendingOperation(null)
    setGitCommitted(false)
    setFilterError(null)
    setActiveTab('filter')
  }

  // Editing the filter invalidates any results shown from a previous run, so clear them — the
  // table and the match count should never display notes that don't correspond to the current
  // criteria.
  function handleCriteriaChange(next: FilterCriteria) {
    setCriteria(next)
    setMatchedNotes(null)
    setResult(null)
    setPreviewNotes(null)
    setPendingOperation(null)
    setFilterError(null)
  }

  async function runFilter() {
    if (!activeVault) return
    setIsFiltering(true)
    setFilterError(null)
    setMatchedNotes(null)
    setResult(null)
    setPreviewNotes(null)
    setPendingOperation(null)
    try {
      const notes = await api.notes.filter(activeVault.id, criteria)
      setMatchedNotes(notes)
    } catch (err) {
      setFilterError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsFiltering(false)
    }
  }

  async function handlePreview(op: Operation) {
    if (!activeVault || !matchedNotes) return
    setPendingOperation(op)
    setIsPreviewing(true)
    try {
      const previewed = await api.notes.previewOperation(activeVault.id, criteria, op)
      setPreviewNotes(previewed)
    } catch {
      // ignore preview errors
    } finally {
      setIsPreviewing(false)
    }
  }

  async function handleApply(op: Operation) {
    if (!activeVault) return
    setPendingOperation(op)
    if (gitStatus?.hasGit) {
      setGitModal({ purpose: 'pre', defaultMsg: buildSnapshotMessage(op) })
    } else {
      await doApply(op)
    }
  }

  async function doApply(op: Operation) {
    if (!activeVault) return
    setIsApplying(true)
    try {
      const res = await api.notes.applyOperation(activeVault.id, criteria, op)
      setResult(res.result)
      setMatchedNotes(res.notes)
      setPreviewNotes(null)
    } catch (err) {
      setFilterError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsApplying(false)
    }
  }

  async function commitGit(message: string) {
    if (!activeVault) return
    await api.git.commit(activeVault.id, message)
    if (gitModal?.purpose === 'pre' && pendingOperation) {
      setGitModal(null)
      await doApply(pendingOperation)
    } else {
      setGitModal(null)
      setGitCommitted(true)
    }
  }

  function handlePostCommit() {
    if (!activeVault || !result) return
    const msg = `chore: apply operation — ${result.succeeded} note${result.succeeded === 1 ? '' : 's'} changed`
    setGitModal({ purpose: 'post', defaultMsg: msg })
  }

  if (isLoading) return null

  if (!activeVault) {
    return (
      <div className={styles.noVault}>
        <h1>Operations</h1>
        <p>No active vault selected. Go to <Link to="/vaults">Vaults</Link> to add and activate a vault first.</p>
      </div>
    )
  }

  // Columns to show in PROPERTY INFO: the filtered properties plus the property(ies) touched by
  // the active operation — for a move that means both the source and the target property.
  const operationProps = pendingOperation
    ? pendingOperation.type === 'move-value'
      ? [pendingOperation.fromProperty, pendingOperation.toProperty]
      : [pendingOperation.property]
    : []
  const highlightedProperties = [
    ...new Set([
      ...criteria.properties.filter((r) => r.property).map((r) => r.property),
      ...operationProps,
    ]),
  ]
  const hasMatches = matchedNotes !== null && matchedNotes.length > 0

  return (
    <div className={styles.page}>
      {gitModal && (
        <GitCommitModal
          title={gitModal.purpose === 'pre' ? 'Git snapshot before operation' : 'Commit changes'}
          description={
            gitModal.purpose === 'pre'
              ? 'Create a safety checkpoint before applying changes. You can roll back to it if anything goes wrong.'
              : "Commit the changes made by the operation to your vault's git history."
          }
          commitLabel={gitModal.purpose === 'pre' ? 'Commit & apply changes' : 'Commit'}
          defaultMessage={gitModal.defaultMsg}
          onCommit={commitGit}
          onSkip={() => {
            if (gitModal.purpose === 'pre' && pendingOperation) {
              setGitModal(null)
              doApply(pendingOperation)
            } else {
              setGitModal(null)
              setGitCommitted(true)
            }
          }}
          onCancel={() => setGitModal(null)}
        />
      )}

      <div className={styles.header}>
        <h1>Operations</h1>
        <span className={styles.vaultName}>{activeVault.name}</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'filter' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('filter')}
        >
          Filter notes
          {matchedNotes !== null && (
            <span className={styles.tabBadge}>{matchedNotes.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'ops' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('ops')}
          disabled={!hasMatches && !result}
        >
          Bulk operation
          {result && (
            <span className={styles.tabBadge}>{result.succeeded}</span>
          )}
        </button>
      </div>

      {/* ── Tab: Filter notes ─────────────────────────────────────────────── */}
      {activeTab === 'filter' && (
        <>
          <div className={styles.section}>
            <FilterBuilder
              criteria={criteria}
              onChange={handleCriteriaChange}
              onRun={runFilter}
              isRunning={isFiltering}
              properties={activeVault.properties}
              dirs={dirs}
              canApplyBulk={hasMatches}
              onApplyBulk={() => setActiveTab('ops')}
            />
            {filterError && (
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                {filterError}
              </p>
            )}
          </div>

          {matchedNotes !== null && (
            <div className={styles.section}>
              <StatsBar matched={matchedNotes.length} />
              <NoteList notes={matchedNotes} highlightProperties={highlightedProperties} />
            </div>
          )}
        </>
      )}

      {/* ── Tab: Bulk operation ───────────────────────────────────────────── */}
      {activeTab === 'ops' && (
        <>
          {matchedNotes !== null && (
            <>
              <div className={styles.section}>
                <div className={styles.operationHeader}>
                  <span className={styles.matchCount}>{matchedNotes.length}</span>
                  {' '}note{matchedNotes.length === 1 ? '' : 's'} matched. Choose an operation…
                </div>
                <BulkOpPanel
                  properties={activeVault.properties}
                  suggestedProperty={criteria.properties[0]?.property}
                  onPreview={handlePreview}
                  onApply={handleApply}
                  isPreviewing={isPreviewing}
                  isApplying={isApplying}
                  matchedNotes={matchedNotes}
                  disableApply={previewNotes !== null && previewNotes.length === 0}
                  onOperationChange={() => setPreviewNotes(null)}
                />
              </div>
              {previewNotes && !result && (
                <div className={styles.section}>
                  <div
                    className={styles.sectionTitle}
                    style={previewNotes.length === 0 ? { color: 'var(--color-error)' } : undefined}
                  >
                    {previewNotes.length === 0
                      ? 'Preview — Change cannot be applied. Rethink the bulk operation.'
                      : `Preview — change will be applied to ${previewNotes.length} out of ${matchedNotes.length} note${matchedNotes.length === 1 ? '' : 's'}`}
                  </div>
                  {previewNotes.length > 0 && (
                    <NoteList notes={previewNotes} highlightProperties={highlightedProperties} />
                  )}
                </div>
              )}
            </>
          )}

          {result && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Results</div>
              <StatsBar matched={result.matched} result={result} />
              <NoteList notes={matchedNotes ?? []} highlightProperties={highlightedProperties} result={result} />
              <div className={styles.postApplyActions}>
                {gitStatus?.hasGit && !gitCommitted && (
                  <button type="button" className={styles.confirmBtn} onClick={handlePostCommit}>
                    Commit changes to git
                  </button>
                )}
                {gitCommitted && (
                  <span className={styles.resultSuccess}>Changes committed to git.</span>
                )}
                <button type="button" className={styles.resetBtn} onClick={reset}>
                  New operation
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Default git snapshot message describing the operation about to be applied. */
function buildSnapshotMessage(op: Operation): string {
  const prefix = `[${APP_NAME}] Before operation: `
  switch (op.type) {
    case 'add-value':
      return `${prefix}add, property: ${op.property}, value: ${op.value}`
    case 'delete-value':
      return `${prefix}delete, property: ${op.property}, value: ${op.value}`
    case 'replace':
      return `${prefix}replace, property: ${op.property}, current_value: ${op.oldValue}, new_value: ${op.newValue}`
    case 'move-value':
      return `${prefix}move, from_property: ${op.fromProperty}, to_property: ${op.toProperty}, value: ${op.value}`
  }
}
