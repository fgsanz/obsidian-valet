import type { ParsedNote, Operation, OperationResult, PropertyDef, PropertyType } from '@shared/types'
import { isValidValueForType } from '@shared/properties'
import { writeNote, normalizeLinkTarget, inferType, isEmptyPropertyValue } from './frontmatter'

function valuesMatch(a: unknown, b: string): boolean {
  const aStr = String(a ?? '')
  const bStr = b.trim()
  if (aStr.toLowerCase() === bStr.toLowerCase()) return true
  const aNorm = normalizeLinkTarget(aStr).toLowerCase()
  const bNorm = normalizeLinkTarget(bStr).toLowerCase()
  return aNorm === bNorm
}

function removeValueFromArray(arr: unknown[], target: string): unknown[] {
  return arr.filter((v) => !valuesMatch(v, target))
}

/** Multi-value property types accept more than one value (stored as an array). */
function isMultiValueType(type: PropertyType): boolean {
  return type === 'text-array' || type === 'tag-array' || type === 'link-array'
}

/** Resolve a property's type from the declared schema, falling back to inference. */
function resolveType(property: string, defs: PropertyDef[], currentValue: unknown): PropertyType {
  // `tags` is always a tag-array (built-in Obsidian property) regardless of stored config.
  if (property === 'tags') return 'tag-array'
  const def = defs.find((d) => d.name === property)
  return def ? def.type : inferType(property, currentValue)
}

function mutateNote(note: ParsedNote, operation: Operation, defs: PropertyDef[]): ParsedNote | null {
  const fm = { ...note.frontmatter }

  if (operation.type === 'delete-value') {
    const { property, value } = operation
    const current = fm[property]
    if (Array.isArray(current)) {
      const next = removeValueFromArray(current, value)
      if (next.length === current.length) return null
      fm[property] = next
    } else if (current != null && valuesMatch(current, value)) {
      fm[property] = null
    } else {
      return null
    }
  } else if (operation.type === 'replace') {
    const { property, oldValue, newValue } = operation
    const current = fm[property]
    const type = resolveType(property, defs, current)
    if (!isValidValueForType(newValue, type)) return null
    if (Array.isArray(current)) {
      let changed = false
      fm[property] = current.map((v) => {
        if (valuesMatch(v, oldValue)) { changed = true; return newValue }
        return v
      })
      if (!changed) return null
    } else if (current != null && valuesMatch(current, oldValue)) {
      fm[property] = newValue
    } else {
      return null
    }
  } else if (operation.type === 'move-value') {
    const { fromProperty, toProperty, value } = operation
    const toType = resolveType(toProperty, defs, fm[toProperty])
    if (!isValidValueForType(value, toType)) return null

    const from = fm[fromProperty]
    let found = false
    if (Array.isArray(from)) {
      const next = removeValueFromArray(from, value)
      if (next.length === from.length) return null
      fm[fromProperty] = next
      found = true
    } else if (from != null && valuesMatch(from, value)) {
      fm[fromProperty] = null
      found = true
    }
    if (!found) return null

    const to = fm[toProperty]
    if (isMultiValueType(toType)) {
      const arr = Array.isArray(to) ? [...to] : to != null ? [to] : []
      if (!arr.some((v) => valuesMatch(v, value))) arr.push(value)
      fm[toProperty] = arr
    } else {
      if (!isEmptyPropertyValue(to)) return null
      fm[toProperty] = value
    }
  } else if (operation.type === 'add-value') {
    const { property, value } = operation
    const current = fm[property]
    const type = resolveType(property, defs, current)
    if (!isValidValueForType(value, type)) return null

    if (isMultiValueType(type)) {
      const arr = Array.isArray(current) ? current : current != null ? [current] : []
      if (arr.some((v) => valuesMatch(v, value))) return null
      fm[property] = [...arr, value]
    } else {
      if (!isEmptyPropertyValue(current)) return null
      fm[property] = value
    }
  }

  return { ...note, frontmatter: fm }
}

export function previewOperation(
  notes: ParsedNote[],
  operation: Operation,
  defs: PropertyDef[],
): ParsedNote[] {
  return notes
    .map((note) => mutateNote(note, operation, defs))
    .filter((n): n is ParsedNote => n !== null)
}

/**
 * Preview the combined effect of applying several operations in order (one per property, e.g. the
 * same value deleted from `parent` then `related`). Each operation sees the result of the previous,
 * so a note touched by any of them appears once with its final state. Returns only changed notes.
 */
export function previewOperations(
  notes: ParsedNote[],
  operations: Operation[],
  defs: PropertyDef[],
): ParsedNote[] {
  const changed: ParsedNote[] = []
  for (const note of notes) {
    let current = note
    let didChange = false
    for (const operation of operations) {
      const mutated = mutateNote(current, operation, defs)
      if (mutated) {
        current = mutated
        didChange = true
      }
    }
    if (didChange) changed.push(current)
  }
  return changed
}

/**
 * Apply several operations in order to the matched notes — the multi-property equivalent of
 * {@link applyOperation}. The operations are applied sequentially in memory (op N sees op N-1's
 * result) and each note is written to disk once, with its final state. A note counts as changed if
 * any operation changed it.
 */
export async function applyOperations(
  notes: ParsedNote[],
  operations: Operation[],
  defs: PropertyDef[],
): Promise<{ result: OperationResult; notesAfter: ParsedNote[] }> {
  const result: OperationResult = {
    matched: notes.length,
    succeeded: 0,
    failed: 0,
    errors: [],
    changedPaths: [],
  }
  const notesAfter: ParsedNote[] = []

  for (const note of notes) {
    let current = note
    let didChange = false
    for (const operation of operations) {
      const mutated = mutateNote(current, operation, defs)
      if (mutated) {
        current = mutated
        didChange = true
      }
    }
    if (!didChange) {
      notesAfter.push(note)
      continue
    }
    try {
      await writeNote(current, defs)
      result.succeeded++
      result.changedPaths.push(note.filePath)
      notesAfter.push(current)
    } catch (err) {
      result.failed++
      result.errors.push({ filePath: note.filePath, error: String(err) })
      notesAfter.push(note)
    }
  }

  return { result, notesAfter }
}

export async function applyOperation(
  notes: ParsedNote[],
  operation: Operation,
  defs: PropertyDef[],
): Promise<OperationResult> {
  const result: OperationResult = {
    matched: notes.length,
    succeeded: 0,
    failed: 0,
    errors: [],
    changedPaths: [],
  }

  for (const note of notes) {
    const mutated = mutateNote(note, operation, defs)
    if (!mutated) continue
    try {
      await writeNote(mutated, defs)
      result.succeeded++
      result.changedPaths.push(note.filePath)
    } catch (err) {
      result.failed++
      result.errors.push({ filePath: note.filePath, error: String(err) })
    }
  }

  return result
}
