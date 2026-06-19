import { isEmptyPropertyValue } from '@shared/properties'

/**
 * Whether (and with what caveat) an "add value" operation applies to a single-value property across
 * the matched notes. The server only fills notes whose value is empty, so:
 *  - `ok`           — every targeted note can receive the value (or it's a multi-value property).
 *  - `some-skipped` — some notes already have a value (they're skipped) but at least one can.
 *  - `all-skipped`  — every note already has a value, so the operation would do nothing.
 */
export type AddValueStatus = 'ok' | 'some-skipped' | 'all-skipped'

export function addValueStatus(
  notes: Array<{ frontmatter: Record<string, unknown> }>,
  property: string,
  isMultiValue: boolean,
): AddValueStatus {
  // Multi-value properties always accept the value (appended unless already present); no caveat.
  if (isMultiValue || !property || notes.length === 0) return 'ok'

  const emptyCount = notes.filter((n) => isEmptyPropertyValue(n.frontmatter[property])).length
  if (emptyCount === 0) return 'all-skipped'
  if (emptyCount < notes.length) return 'some-skipped'
  return 'ok'
}

/** Whether the add-value operation can be applied to at least one matched note. */
export function canAddValue(status: AddValueStatus): boolean {
  return status !== 'all-skipped'
}
