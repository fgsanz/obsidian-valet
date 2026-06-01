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
  const [isApplying, setIsApplying] = useState(false)
  const [result, setResult] = useState<OperationResult | null>(null)
  const [gitModal, setGitModal] = useState<GitModalState>(null)
  const [pendingOperation, setPendingOperation] = useState<Operation | null>(null)
  const [gitCommitted, setGitCommitted] = useState(false)

  function reset() {
    setMatchedNotes(null)
    setResult(null)
    setPendingOperation(null)
    setGitCommitted(false)
    setFilterError(null)
    setActiveTab('filter')
  }

  async function runFilter() {
    if (!activeVault) return
    setIsFiltering(true)
    setFilterError(null)
    setMatchedNotes(null)
    setResult(null)
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
    setIsPreviewing(true)
    try {
      const previewed = await api.notes.previewOperation(activeVault.id, criteria, op)
      setMatchedNotes(previewed)
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
      const suggest = await api.git.suggestMessage(activeVault.id, describeOperation(op))
      setGitModal({ purpose: 'pre', defaultMsg: suggest?.message ?? 'chore: snapshot' })
    } else {
      await doApply(op)
    }
  }

  async function doApply(op: Operation) {
    if (!activeVault) return
    setIsApplying(true)
    try {
      const res = await api.notes.applyOperation(activeVault.id, criteria, op)
      setResult(res)
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

  const highlightedProperties = criteria.properties.filter((r) => r.property).map((r) => r.property)
  const hasMatches = matchedNotes !== null && matchedNotes.length > 0

  return (
    <div className={styles.page}>
      {gitModal && (
        <GitCommitModal
          title={gitModal.purpose === 'pre' ? 'Snapshot before operation' : 'Commit changes'}
          description={
            gitModal.purpose === 'pre'
              ? 'Create a safety checkpoint before applying changes. You can roll back to this if anything goes wrong.'
              : "Commit the changes made by the operation to your vault's git history."
          }
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
            <div className={styles.sectionTitle}>Filter rules</div>
            <FilterBuilder
              criteria={criteria}
              onChange={setCriteria}
              onRun={runFilter}
              isRunning={isFiltering}
              properties={activeVault.properties}
              dirs={dirs}
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
              {hasMatches && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ops')}
                    style={{
                      background: 'var(--color-accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      padding: 'var(--space-2) var(--space-5)',
                      cursor: 'pointer',
                    }}
                  >
                    Choose bulk operation →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Bulk operation ───────────────────────────────────────────── */}
      {activeTab === 'ops' && (
        <>
          {!result && matchedNotes !== null && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  {matchedNotes.length} note{matchedNotes.length === 1 ? '' : 's'} matched — choose an operation
                </div>
                <BulkOpPanel
                  properties={activeVault.properties}
                  suggestedProperty={criteria.properties[0]?.property}
                  onPreview={handlePreview}
                  onApply={handleApply}
                  isPreviewing={isPreviewing}
                  isApplying={isApplying}
                />
              </div>
              {isPreviewing && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Preview</div>
                  <NoteList notes={matchedNotes} highlightProperties={highlightedProperties} />
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

function describeOperation(op: Operation): string {
  if (op.type === 'delete-value') return `delete "${op.value}" from ${op.property}`
  if (op.type === 'replace') return `replace "${op.oldValue}" with "${op.newValue}" in ${op.property}`
  if (op.type === 'move-value') return `move "${op.value}" from ${op.fromProperty} to ${op.toProperty}`
  return 'operation'
}
