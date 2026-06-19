import { isEmptyPropertyValue } from '@shared/properties'

/**
 * Whether (and with what caveat) a delete-value operation applies across the matched notes. A note
 * can only have something deleted if it actually holds a non-empty value for the property:
 *  - `ok`           — every matched note has the property with content.
 *  - `some-skipped` — some notes lack the property or have it empty, but at least one has content.
 *  - `all-skipped`  — no note has content, so the operation can't change anything.
 */
export type DeleteValueStatus = 'ok' | 'some-skipped' | 'all-skipped'

export function deleteValueStatus(
  notes: Array<{ frontmatter: Record<string, unknown> }>,
  property: string,
): DeleteValueStatus {
  // No property selected or no matched notes yet → not enough info to block (gated elsewhere).
  if (!property || notes.length === 0) return 'ok'

  const withContent = notes.filter((n) => !isEmptyPropertyValue(n.frontmatter[property])).length
  if (withContent === 0) return 'all-skipped'
  if (withContent < notes.length) return 'some-skipped'
  return 'ok'
}

/** Whether the delete-value operation can affect at least one matched note. */
export function canDeleteValue(status: DeleteValueStatus): boolean {
  return status !== 'all-skipped'
}
