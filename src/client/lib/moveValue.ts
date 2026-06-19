import { isEmptyPropertyValue } from '@shared/properties'

/**
 * Whether (and with what caveat) a move-value operation applies across the matched notes. A note can
 * be moved only if its source property has content AND the target can receive it — a multi-value
 * target always can, a single-value target only when it is currently empty. (A wrong value format
 * for the target is handled separately as a hard validation error, not here.)
 *  - `ok`           — every matched note can be moved.
 *  - `some-skipped` — some notes can't (empty source, or full single-value target) but at least one can.
 *  - `all-skipped`  — no note can be moved, so the operation can't change anything.
 */
export type MoveValueStatus = 'ok' | 'some-skipped' | 'all-skipped'

export function moveValueStatus(
  notes: Array<{ frontmatter: Record<string, unknown> }>,
  fromProperty: string,
  toProperty: string,
  toIsMultiValue: boolean,
): MoveValueStatus {
  // Not enough info to block yet (gated elsewhere): no properties selected, or no matched notes.
  if (!fromProperty || !toProperty || notes.length === 0) return 'ok'

  const canMove = notes.filter((n) => {
    if (isEmptyPropertyValue(n.frontmatter[fromProperty])) return false // nothing to move out
    if (toIsMultiValue) return true // a multi-value target always accepts the value
    return isEmptyPropertyValue(n.frontmatter[toProperty]) // single-value target must be empty
  }).length

  if (canMove === 0) return 'all-skipped'
  if (canMove < notes.length) return 'some-skipped'
  return 'ok'
}

/** Whether the move-value operation can affect at least one matched note. */
export function canMoveValue(status: MoveValueStatus): boolean {
  return status !== 'all-skipped'
}
