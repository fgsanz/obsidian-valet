import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { loadOperationsSnapshot, saveOperationsSnapshot } from '../lib/operationsSnapshot'
import type { FilterCriteria, Operation, ParsedNote, OperationResult } from '@shared/types'
import FilterBuilder from '../components/FilterBuilder'
import NoteList from '../components/NoteList'
import StatsBar from '../components/StatsBar'
import BulkOpPanel from '../components/BulkOpPanel'
import GitCommitModal from '../components/GitCommitModal'
import { APP_NAME } from '@shared/constants'
import styles from './OperationsPage.module.css'

type Tab = 'filter' | 'ops'
type GitModalState =
  | { kind: 'snapshot'; message: string } // safety snapshot before applying
  | { kind: 'commit'; message: string } // commit the applied changes
  | { kind: 'revert' } // confirm reverting the applied changes
  | { kind: 'reverted' } // revert finished — info only
  | null

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

  // Restore the page state captured before we last left it — but only if it belongs to the still-
  // active vault. This keeps the filter/results/selections intact when bouncing to Vaults and back.
  const restored = loadOperationsSnapshot(activeVault?.id ?? null)

  const [activeTab, setActiveTab] = useState<Tab>(restored?.activeTab ?? 'filter')

  const [criteria, setCriteria] = useState<FilterCriteria>(
    restored?.criteria ?? {
      location: [{ operator: 'all-directories', combinator: 'and' }],
      properties: [{ property: '', operator: 'contains', combinator: 'and' }],
    },
  )
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterError, setFilterError] = useState<string | null>(restored?.filterError ?? null)
  const [matchedNotes, setMatchedNotes] = useState<ParsedNote[] | null>(restored?.matchedNotes ?? null)

  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewNotes, setPreviewNotes] = useState<ParsedNote[] | null>(restored?.previewNotes ?? null)
  const [isApplying, setIsApplying] = useState(false)
  const [result, setResult] = useState<OperationResult | null>(restored?.result ?? null)
  const [gitModal, setGitModal] = useState<GitModalState>(null)
  const [pendingOperations, setPendingOperations] = useState<Operation[] | null>(restored?.pendingOperations ?? null)
  const [gitCommitted, setGitCommitted] = useState(restored?.gitCommitted ?? false)

  // Persist the page state on every change so it can be restored after navigating away and back.
  useEffect(() => {
    if (!activeVault) return
    saveOperationsSnapshot({
      vaultId: activeVault.id,
      activeTab,
      criteria,
      matchedNotes,
      previewNotes,
      result,
      pendingOperations,
      gitCommitted,
      filterError,
    })
  }, [activeVault, activeTab, criteria, matchedNotes, previewNotes, result, pendingOperations, gitCommitted, filterError])

  // Editing the filter invalidates any results shown from a previous run, so clear them — the
  // table and the match count should never display notes that don't correspond to the current
  // criteria.
  function handleCriteriaChange(next: FilterCriteria) {
    setCriteria(next)
    setMatchedNotes(null)
    setResult(null)
    setPreviewNotes(null)
    setPendingOperations(null)
    setFilterError(null)
  }

  async function runFilter() {
    if (!activeVault) return
    setIsFiltering(true)
    setFilterError(null)
    setMatchedNotes(null)
    setResult(null)
    setPreviewNotes(null)
    setPendingOperations(null)
    try {
      const notes = await api.notes.filter(activeVault.id, criteria)
      setMatchedNotes(notes)
    } catch (err) {
      setFilterError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsFiltering(false)
    }
  }

  async function handlePreview(ops: Operation[]) {
    if (!activeVault || !matchedNotes) return
    setPendingOperations(ops)
    setIsPreviewing(true)
    try {
      const previewed = await api.notes.previewOperations(activeVault.id, criteria, ops)
      setPreviewNotes(previewed)
    } catch {
      // ignore preview errors
    } finally {
      setIsPreviewing(false)
    }
  }

  /** Reset the whole operation flow back to a clean filter view. */
  function resetOperation() {
    setMatchedNotes(null)
    setResult(null)
    setPreviewNotes(null)
    setPendingOperations(null)
    setGitCommitted(false)
    setFilterError(null)
    setActiveTab('filter')
  }

  async function handleApply(ops: Operation[]) {
    if (!activeVault) return
    setPendingOperations(ops)
    if (gitStatus?.hasGit) {
      setGitModal({ kind: 'snapshot', message: buildOperationsMessage(ops, 'Before') })
    } else {
      await doApply(ops)
    }
  }

  async function doApply(ops: Operation[]) {
    if (!activeVault) return
    setIsApplying(true)
    try {
      const res = await api.notes.applyOperations(activeVault.id, criteria, ops)
      setResult(res.result)
      setMatchedNotes(res.notes)
      setPreviewNotes(null)
    } catch (err) {
      setFilterError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsApplying(false)
    }
  }

  /** Commit the safety snapshot, then apply the pending operations. */
  async function commitSnapshotAndApply(message: string) {
    if (!activeVault) return
    await api.git.commit(activeVault.id, message)
    setGitModal(null)
    if (pendingOperations) await doApply(pendingOperations)
  }

  /** Commit the changes produced by the operation. */
  async function commitAppliedChanges(message: string) {
    if (!activeVault) return
    await api.git.commit(activeVault.id, message)
    setGitModal(null)
    setGitCommitted(true)
  }

  /** Revert the vault to the safety snapshot, discarding the operation's changes. */
  async function revertAppliedChanges() {
    if (!activeVault) return
    await api.git.revert(activeVault.id)
    setGitModal({ kind: 'reverted' })
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

  // Columns to show in PROPERTY INFO: the filtered properties plus every property touched by the
  // pending operations — for a move that means both the source and the target property.
  const operationProps = (pendingOperations ?? []).flatMap((op) =>
    op.type === 'move-value' ? [op.fromProperty, op.toProperty] : [op.property],
  )
  const highlightedProperties = [
    ...new Set([
      ...criteria.properties.filter((r) => r.property).map((r) => r.property),
      ...operationProps,
    ]),
  ]
  const hasMatches = matchedNotes !== null && matchedNotes.length > 0

  return (
    <div className={styles.page}>
      {gitModal?.kind === 'snapshot' && (
        <GitCommitModal
          title="Git snapshot before operation"
          description="Create a safety checkpoint before applying changes. You can roll back to it if anything goes wrong."
          commitLabel="Commit & apply changes"
          defaultMessage={gitModal.message}
          onCommit={commitSnapshotAndApply}
          onSkip={() => {
            setGitModal(null)
            if (pendingOperations) doApply(pendingOperations)
          }}
          onCancel={() => setGitModal(null)}
        />
      )}

      {gitModal?.kind === 'commit' && (
        <GitCommitModal
          title="Commit changes"
          description="If you are happy with the changes, create a new commit containing those changes."
          commitLabel="Commit changes to git"
          defaultMessage={gitModal.message}
          onCommit={commitAppliedChanges}
          onCancel={() => setGitModal(null)}
        />
      )}

      {gitModal?.kind === 'revert' && (
        <GitCommitModal
          title="Revert changes"
          description="If you are not satisfied with the changes, revert the vault to a state just before the changes."
          commitLabel="Revert to safety git snapshot"
          showMessage={false}
          onCommit={revertAppliedChanges}
          onCancel={() => setGitModal(null)}
        />
      )}

      {gitModal?.kind === 'reverted' && (
        <GitCommitModal
          title="Changes reverted"
          description="The vault has been reverted to the safety git snapshot, the state just before the operation."
          commitLabel="Got it"
          showMessage={false}
          showCancel={false}
          onCommit={async () => resetOperation()}
          onCancel={resetOperation}
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
      {/* Both tabs stay mounted (hidden via display) so switching back and forth
          preserves the filter, results, and the operation being configured. */}
      <div style={{ display: activeTab === 'filter' ? 'contents' : 'none' }}>
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
      </div>

      {/* ── Tab: Bulk operation ───────────────────────────────────────────── */}
      <div style={{ display: activeTab === 'ops' ? 'contents' : 'none' }}>
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
                  applied={result !== null}
                  canCommit={
                    !!gitStatus?.hasGit && result !== null && result.failed === 0 && !gitCommitted
                  }
                  canRevert={!!gitStatus?.hasGit && result !== null && result.failed > 0}
                  onCommitChanges={() => {
                    if (pendingOperations)
                      setGitModal({ kind: 'commit', message: buildOperationsMessage(pendingOperations, 'After') })
                  }}
                  onRevertChanges={() => setGitModal({ kind: 'revert' })}
                  onOperationChange={() => {
                    setPreviewNotes(null)
                    setResult(null)
                    setGitCommitted(false)
                  }}
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
              {gitCommitted && (
                <div className={styles.postApplyActions}>
                  <span className={styles.resultSuccess}>Changes committed to git.</span>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  )
}

/** Short description of a single operation, used to build commit messages. */
function describeOperation(op: Operation): string {
  switch (op.type) {
    case 'add-value':
      return `add, property: ${op.property}, value: ${op.value}`
    case 'delete-value':
      return `delete, property: ${op.property}, value: ${op.value}`
    case 'replace':
      return `replace, property: ${op.property}, current_value: ${op.oldValue}, new_value: ${op.newValue}`
    case 'move-value':
      return `move, from_property: ${op.fromProperty}, to_property: ${op.toProperty}, value: ${op.value}`
  }
}

/**
 * Git commit message describing the operation(s), either Before (snapshot) or After they ran.
 * Multiple operations are listed, one per line, under the prefixed header.
 */
function buildOperationsMessage(ops: Operation[], phase: 'Before' | 'After'): string {
  const prefix = `[${APP_NAME}] ${phase}: `
  if (ops.length === 1) return prefix + describeOperation(ops[0])
  return `${prefix}${ops.length} operations\n` + ops.map((op) => `- ${describeOperation(op)}`).join('\n')
}
