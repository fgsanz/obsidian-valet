import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trash2, Info } from 'lucide-react'
import { api } from '../api/client'
import Selector from '../components/Selector'
import ValueInput from '../components/ValueInput'
import GitCommitModal from '../components/GitCommitModal'
import ConfirmModal from '../components/ConfirmModal'
import Tooltip from '../components/Tooltip'
import { resolvePropertyType, isValidValueForType, expectedFormatHint } from '@shared/properties'
import { getValuePlaceholder } from '../lib/operators'
import { makePropRow, splitExampleNames, canRunSplit, type PropRow } from '../lib/kindleSplit'
import { APP_NAME } from '@shared/constants'
import type { SplitNote, KindleSplitOptions, KindleSplitResult } from '@shared/types'
import styles from './BodyNotePage.module.css'

type Tab = 'kindle' | 'audible'
type GitModalState =
  | { kind: 'snapshot'; message: string }
  | { kind: 'commit'; message: string }
  | { kind: 'revert' }
  | { kind: 'revert-unsafe' }
  | { kind: 'reverted' }
  | null

export default function BodyNotePage() {
  const { data: activeVault, isLoading } = useQuery({
    queryKey: ['vaults', 'active'],
    queryFn: api.vaults.getActive,
  })
  const { data: gitStatus } = useQuery({
    queryKey: ['git', 'status', activeVault?.id],
    queryFn: () => api.git.status(activeVault!.id),
    enabled: !!activeVault?.id,
  })
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', 'list', activeVault?.id],
    queryFn: () => api.notes.list(activeVault!.id),
    enabled: !!activeVault?.id,
  })

  const [activeTab, setActiveTab] = useState<Tab>('kindle')
  const [noteInput, setNoteInput] = useState('')
  const [prefix, setPrefix] = useState('')
  const [startInput, setStartInput] = useState('1')
  const [targetDir, setTargetDir] = useState('')
  const [propRows, setPropRows] = useState<PropRow[]>([makePropRow()])
  const [keepOriginal, setKeepOriginal] = useState(true)

  const [previewNotes, setPreviewNotes] = useState<SplitNote[] | null>(null)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [result, setResult] = useState<KindleSplitResult | null>(null)
  const [gitModal, setGitModal] = useState<GitModalState>(null)
  const [pendingOptions, setPendingOptions] = useState<KindleSplitOptions | null>(null)
  const [snapshotTaken, setSnapshotTaken] = useState(false)
  const [gitCommitted, setGitCommitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const properties = activeVault?.properties ?? []
  const propertyNames = useMemo(
    () => properties.map((p) => p.name).sort((a, b) => a.localeCompare(b)),
    [properties],
  )
  const noteOptions = useMemo(() => notes.map((n) => n.title), [notes])
  const selected = useMemo(() => notes.find((n) => n.title === noteInput) ?? null, [notes, noteInput])
  const isKindle = !!selected?.isKindle
  const highlightsCount = selected?.highlightsCount ?? null

  const startNumber = parseInt(startInput, 10)
  const examples = splitExampleNames(
    prefix.trim() || '…',
    Number.isFinite(startNumber) ? startNumber : 1,
    highlightsCount ?? 1,
    highlightsCount,
  )

  function rowError(row: PropRow): boolean {
    if (!row.name.trim() || !row.value.trim()) return false
    return !isValidValueForType(row.value, resolvePropertyType(row.name, properties))
  }
  const anyPropInvalid = propRows.some(rowError)
  const canRun = canRunSplit({ isKindle, prefix, targetDir }) && !anyPropInvalid

  /** Editing any option invalidates a shown preview/result — clear them so nothing goes stale. */
  function invalidateRun() {
    setPreviewNotes(null)
    setResult(null)
    setGitCommitted(false)
    setError(null)
  }

  function handleNoteChange(v: string) {
    setNoteInput(v)
    invalidateRun()
    const match = notes.find((n) => n.title === v)
    if (match?.isKindle) {
      // Sensible defaults on selection: prefix = the note name, folder = the note's folder.
      setPrefix(v)
      setTargetDir(match.dir)
    }
  }

  function updateRow(id: string, patch: Partial<PropRow>) {
    setPropRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    invalidateRun()
  }
  function addRow() {
    setPropRows((rows) => [...rows, makePropRow()])
  }
  function removeRow(id: string) {
    setPropRows((rows) => (rows.length === 1 ? [makePropRow()] : rows.filter((r) => r.id !== id)))
    invalidateRun()
  }

  function buildOptions(): KindleSplitOptions {
    return {
      prefix: prefix.trim(),
      startNumber: Number.isFinite(startNumber) ? startNumber : 1,
      targetDir,
      properties: propRows
        .filter((r) => r.name.trim() && r.value.trim())
        .map((r) => ({ name: r.name.trim(), value: r.value.trim() })),
      deleteOriginal: !keepOriginal,
    }
  }

  function runMessage(phase: 'Before' | 'After'): string {
    const n = highlightsCount ?? previewNotes?.length ?? '?'
    return `[${APP_NAME}] ${phase}: Kindle split "${selected?.title}" → ${n} notes`
  }

  async function handlePreview() {
    if (!activeVault || !selected) return
    setIsPreviewing(true)
    setError(null)
    try {
      const notesOut = await api.notes.kindleSplitPreview(activeVault.id, selected.relativePath, buildOptions())
      setPreviewNotes(notesOut)
      setPreviewIdx(0)
      setPreviewOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsPreviewing(false)
    }
  }

  function handleApply() {
    if (!activeVault || !selected) return
    const opts = buildOptions()
    setPendingOptions(opts)
    if (gitStatus?.hasGit) {
      setGitModal({ kind: 'snapshot', message: runMessage('Before') })
    } else {
      setSnapshotTaken(false)
      void doApply(opts)
    }
  }

  async function doApply(opts: KindleSplitOptions) {
    if (!activeVault || !selected) return
    setIsApplying(true)
    setError(null)
    try {
      const res = await api.notes.kindleSplitApply(activeVault.id, selected.relativePath, opts)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsApplying(false)
    }
  }

  async function commitSnapshotAndApply(message: string) {
    if (!activeVault) return
    await api.git.commit(activeVault.id, message, true)
    setSnapshotTaken(true)
    setGitModal(null)
    if (pendingOptions) await doApply(pendingOptions)
  }

  async function commitAppliedChanges(message: string) {
    if (!activeVault) return
    await api.git.commit(activeVault.id, message)
    setGitModal(null)
    setGitCommitted(true)
  }

  async function revertAppliedChanges() {
    if (!activeVault || !result) return
    await api.notes.kindleSplitRevert(activeVault.id, result.createdPaths, snapshotTaken)
    setResult(null)
    setGitModal({ kind: 'reverted' })
  }

  if (isLoading) return null
  if (!activeVault) {
    return (
      <div className={styles.noVault}>
        <h1>Body note</h1>
        <p>
          No active vault selected. Go to <Link to="/vaults">Vaults</Link> to add and activate a
          vault first.
        </p>
      </div>
    )
  }

  const canCommit = !!gitStatus?.hasGit && result !== null && !gitCommitted
  const canRevert = result !== null && !gitCommitted

  return (
    <div className={styles.page}>
      {gitModal?.kind === 'snapshot' && (
        <GitCommitModal
          title="Git snapshot before splitting"
          description="Create a safety checkpoint before creating the split notes. You can roll back to it if anything goes wrong."
          commitLabel="Commit & split"
          defaultMessage={gitModal.message}
          onCommit={commitSnapshotAndApply}
          onSkip={() => {
            setSnapshotTaken(false)
            setGitModal(null)
            if (pendingOptions) void doApply(pendingOptions)
          }}
          onCancel={() => setGitModal(null)}
        />
      )}
      {gitModal?.kind === 'commit' && (
        <GitCommitModal
          title="Commit the new notes"
          description="If you are happy with the split, commit the newly created notes to git."
          commitLabel="Commit to git"
          defaultMessage={gitModal.message}
          onCommit={commitAppliedChanges}
          onCancel={() => setGitModal(null)}
        />
      )}
      {gitModal?.kind === 'revert' && (
        <GitCommitModal
          title="Revert the split"
          description="Delete the notes just created and restore the vault to the safety snapshot."
          commitLabel="Revert changes"
          showMessage={false}
          onCommit={revertAppliedChanges}
          onCancel={() => setGitModal(null)}
        />
      )}
      {gitModal?.kind === 'revert-unsafe' && (
        <ConfirmModal
          title="Important"
          message={
            <>
              No snapshot was taken before this split. Reverting will delete the created notes, but a
              deleted original note cannot be restored. Type <code>revert</code> to confirm.
            </>
          }
          requireText="revert"
          inputLabel="Confirmation"
          confirmLabel="Revert changes"
          onConfirm={() => {
            setGitModal(null)
            void revertAppliedChanges()
          }}
          onCancel={() => setGitModal(null)}
        />
      )}
      {gitModal?.kind === 'reverted' && (
        <GitCommitModal
          title="Split reverted"
          description="The created notes were removed and the vault restored to the state just before the split."
          commitLabel="Got it"
          showMessage={false}
          showCancel={false}
          onCommit={async () => setGitModal(null)}
          onCancel={() => setGitModal(null)}
        />
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Body note</h1>
        <span className={styles.vaultName}>@{activeVault.name}</span>
        {gitStatus &&
          (gitStatus.hasGit ? (
            <span className={styles.gitReadyPill}>Git ready</span>
          ) : (
            <span className={styles.noGit}>(no .git)</span>
          ))}
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'kindle' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('kindle')}
        >
          Kindle highlights split
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'audible' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('audible')}
        >
          Audible splits
        </button>
      </div>

      {activeTab === 'audible' && (
        <div className={styles.emptyTab}>Audible splits — planned. This tab is intentionally empty for now.</div>
      )}

      {activeTab === 'kindle' && (
        <>
          <div className={styles.motivation}>
            <p className={styles.motivationText}>
              Split a single “Kindle highlights” note into many atomic notes — one highlight per note.
              Atomic, self-contained notes connect better across topics and make far more meaningful
              RAG embeddings than one giant note.
            </p>
            <Link className={styles.docLink} to="/docs/kindle-highlights-split">
              Learn more → Kindle highlights split
            </Link>
          </div>

          <div className={styles.steps}>
            {/* Step 1 — note */}
            <section className={styles.step}>
              <StepHead n={1} title="Choose the Kindle highlights note" />
              <div className={styles.stepBody}>
                <div className={styles.label}>Kindle highlights note</div>
                <Selector
                  value={noteInput}
                  onChange={handleNoteChange}
                  options={noteOptions}
                  placeholder="Type a note name…"
                  emptyMessage="No matching note"
                />
                {noteInput && selected && isKindle && (
                  <div className={`${styles.banner} ${styles.bannerSuccess}`}>
                    ✓ Valid Kindle highlights note — <strong>{highlightsCount} highlights</strong> found.
                  </div>
                )}
                {noteInput && selected && !isKindle && (
                  <div className={`${styles.banner} ${styles.bannerError}`}>
                    ✗ Not a Kindle highlights note. Pick a note created by the Kindle Highlights plugin.
                  </div>
                )}
              </div>
            </section>

            {/* Step 2 — naming */}
            <Step n={2} title="Name the split notes" disabled={!isKindle}>
              <div className={styles.row}>
                <div className={styles.grow}>
                  <div className={styles.label}>
                    Name prefix for split notes
                    <Tooltip content="The final note’s name is the prefix followed by an incrementing counter, zero-padded to match the width of kindle-highlightsCount (e.g., 187 → three digits counter)." className={styles.labelInfo}>
                      <Info size={14} aria-label="More info" />
                    </Tooltip>
                  </div>
                  <ValueInput value={prefix} onChange={(v) => { setPrefix(v); invalidateRun() }} placeholder="e.g., Book title - Kindle highlights" />
                </div>
                <div className={styles.startField}>
                  <div className={styles.label}>Start number</div>
                  <input
                    className={styles.startInput}
                    value={startInput}
                    inputMode="numeric"
                    onChange={(e) => { setStartInput(e.target.value.replace(/[^0-9]/g, '')); invalidateRun() }}
                  />
                </div>
              </div>
              {isKindle && prefix.trim() && (
                <div className={styles.examples}>
                  <span>First: <code className={styles.code}>{examples.first}</code></span>
                  <span>Last: <code className={styles.code}>{examples.last}</code></span>
                </div>
              )}
            </Step>

            {/* Step 3 — folder */}
            <Step n={3} title="Choose the target folder" disabled={!isKindle}
              hint="Autocomplete of existing folders only. Defaults to the original note’s folder.">
              <div className={styles.label}>Target folder</div>
              <FolderPicker
                vaultId={activeVault.id}
                value={targetDir}
                onChange={(v) => { setTargetDir(v); invalidateRun() }}
              />
            </Step>

            {/* Step 4 — properties */}
            <Step n={4} title="Add properties to the split notes" optional disabled={!isKindle}
              hint="Only properties already defined in the vault. Values are validated by the property’s type — same rules as bulk operations.">
              <div className={styles.propNote}>
                A <code>source</code> link back to the original note is added automatically — unless you
                add a property that already links to it.
              </div>
              <div className={styles.propHeader}>
                <span className={styles.propHeaderLabel}>Property</span>
                <span className={styles.propHeaderLabel}>Value to add</span>
                <span style={{ width: 36 }} />
              </div>
              <div className={styles.propRows}>
                {propRows.map((row) => {
                  const invalid = rowError(row)
                  const type = row.name.trim() ? resolvePropertyType(row.name, properties) : undefined
                  return (
                    <div key={row.id}>
                      <div className={styles.propRow}>
                        <div className={styles.propField}>
                          <Selector
                            value={row.name}
                            onChange={(v) => updateRow(row.id, { name: v })}
                            options={propertyNames}
                            placeholder="select property"
                            emptyMessage="No matching property"
                          />
                        </div>
                        <div className={styles.propField}>
                          <ValueInput
                            value={row.value}
                            onChange={(v) => updateRow(row.id, { value: v })}
                            placeholder={type ? getValuePlaceholder(type) : 'e.g., value'}
                            invalid={invalid}
                          />
                        </div>
                        <Tooltip content="Delete">
                          <button
                            type="button"
                            className={styles.removeBtn}
                            aria-label="Delete property"
                            onClick={() => removeRow(row.id)}
                            disabled={propRows.length === 1 && !row.name && !row.value}
                          >
                            <Trash2 size={18} />
                          </button>
                        </Tooltip>
                      </div>
                      {invalid && type && (
                        <div className={styles.errorText}>Value must be {expectedFormatHint(type)}.</div>
                      )}
                    </div>
                  )
                })}
              </div>
              <button type="button" className={styles.addRowBtn} onClick={addRow}>
                + Add property
              </button>
            </Step>

            {/* Step 5 — original */}
            <Step n={5} title="The original note" optional disabled={!isKindle}>
              <div className={styles.radios}>
                {[
                  { keep: true, label: 'Keep the original note' },
                  { keep: false, label: 'Delete the original note after splitting' },
                ].map((opt) => (
                  <label key={String(opt.keep)} className={styles.radioRow} onClick={() => { setKeepOriginal(opt.keep); invalidateRun() }}>
                    <span className={`${styles.radio} ${keepOriginal === opt.keep ? styles.radioOn : ''}`}>
                      {keepOriginal === opt.keep && <span className={styles.radioDot} />}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </Step>

            {/* Step 6 — preview, safety & run */}
            <Step n={6} title="Preview, safety & run" disabled={!isKindle}>
              {gitStatus?.hasGit && (
                <div className={styles.gitSafety}>
                  Git is ready. When you split, you’ll be offered a <strong>snapshot before</strong>, a{' '}
                  <strong>commit after</strong>, and the option to <strong>revert</strong> — the created
                  notes are removed on revert, since Git alone leaves new files behind.
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.previewBtn}
                  onClick={handlePreview}
                  disabled={!canRun || isPreviewing || isApplying}
                >
                  {isPreviewing ? 'Previewing…' : 'Preview'}
                </button>
                <button
                  type="button"
                  className={styles.applyBtn}
                  onClick={handleApply}
                  disabled={!canRun || isApplying || result !== null}
                >
                  {isApplying ? 'Splitting…' : `Split into ${highlightsCount ?? ''} notes`}
                </button>
                {!canRun && <span className={styles.hint}>Enabled once a valid note, a prefix and a folder are set.</span>}

                {(canCommit || canRevert) && (
                  <div className={styles.optionalArea}>
                    <span className={styles.optionalLabel}>Optional →</span>
                    {canCommit && (
                      <button type="button" className={styles.optionalBtn} onClick={() => setGitModal({ kind: 'commit', message: runMessage('After') })}>
                        Commit changes
                      </button>
                    )}
                    {canRevert && (
                      <button type="button" className={styles.optionalBtn} onClick={() => setGitModal({ kind: snapshotTaken ? 'revert' : 'revert-unsafe' })}>
                        Revert changes
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isApplying && (
                <div className={styles.progress}>
                  <div className={styles.progressLabel}>Creating {highlightsCount} notes…</div>
                  <div className={styles.progressBar}><div className={styles.progressFill} /></div>
                </div>
              )}

              {result && (
                <div className={`${styles.banner} ${styles.bannerSuccess} ${styles.resultBanner}`}>
                  <span>
                    ✓ Done — <strong>{result.created} notes</strong> created in <code>{targetDir || '(vault root)'}</code>.{' '}
                    {result.originalDeleted ? 'Original deleted.' : 'Original kept.'}
                    {gitCommitted && ' Committed to git.'}
                  </span>
                </div>
              )}

              {error && <div className={styles.errorText}>{error}</div>}
            </Step>
          </div>
        </>
      )}

      {previewOpen && previewNotes && previewNotes.length > 0 && (
        <PreviewModal
          notes={previewNotes}
          idx={previewIdx}
          setIdx={setPreviewIdx}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}

/** Step header (number + title + optional tag). */
function StepHead({ n, title, optional }: { n: number; title: string; optional?: boolean }) {
  return (
    <div className={styles.stepHead}>
      <span className={styles.stepNum}>{n}</span>
      <h3 className={styles.stepTitle}>{title}</h3>
      {optional && <span className={styles.optional}>Optional</span>}
    </div>
  )
}

/** A numbered step card with an optional hint and a disabled state. */
function Step({
  n, title, optional, disabled, hint, children,
}: {
  n: number
  title: string
  optional?: boolean
  disabled?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className={`${styles.step} ${disabled ? styles.stepDisabled : ''}`}>
      <StepHead n={n} title={title} optional={optional} />
      {hint && <p className={styles.stepHint}>{hint}</p>}
      <div className={`${styles.stepBody} ${hint ? styles.stepBodyFlush : ''}`}>{children}</div>
    </section>
  )
}

/** Directory autocomplete (existing folders only), backed by the vault's directory list. */
function FolderPicker({ vaultId, value, onChange }: { vaultId: string; value: string; onChange: (v: string) => void }) {
  const { data: dirs = [] } = useQuery({
    queryKey: ['vault', 'directories', vaultId],
    queryFn: () => api.vaults.directories(vaultId),
  })
  return (
    <Selector
      value={value}
      onChange={onChange}
      options={dirs}
      placeholder="select directory"
      emptyMessage="No matching directory"
    />
  )
}

/** Paged, read-only viewer for the generated split notes (nothing is written). */
function PreviewModal({
  notes, idx, setIdx, onClose,
}: {
  notes: SplitNote[]
  idx: number
  setIdx: (i: number) => void
  onClose: () => void
}) {
  const note = notes[idx]
  const human = idx + 1
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Preview — split note {human} of {notes.length}</span>
          <button type="button" className={styles.modalClose} aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalSub}>Nothing is written yet. Step through every note the split would create.</div>

        <div className={styles.fieldLabel}>Filename</div>
        <div className={styles.noteName}>{note.fileName}</div>

        <div className={styles.fieldLabel}>Content</div>
        <pre className={styles.notePre}>{note.content}</pre>

        <div className={styles.pager}>
          <button type="button" className={styles.navBtn} disabled={idx === 0} onClick={() => setIdx(Math.max(0, idx - 1))}>‹ Previous</button>
          <span className={styles.pagerInfo}>{human} / {notes.length}</span>
          <button type="button" className={styles.navBtn} disabled={human === notes.length} onClick={() => setIdx(Math.min(notes.length - 1, idx + 1))}>Next ›</button>
        </div>
      </div>
    </div>
  )
}
