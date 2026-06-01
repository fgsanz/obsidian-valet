import type { ParsedNote, Operation, OperationResult, PropertyDef } from '@shared/types'
import { writeNote, normalizeLinkTarget } from './frontmatter'

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

function mutateNote(note: ParsedNote, operation: Operation): ParsedNote | null {
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
    if (Array.isArray(to)) {
      fm[toProperty] = [...to, value]
    } else if (to != null) {
      fm[toProperty] = [to, value]
    } else {
      fm[toProperty] = [value]
    }
  }

  return { ...note, frontmatter: fm }
}

export function previewOperation(
  notes: ParsedNote[],
  operation: Operation,
  _defs: PropertyDef[],
): ParsedNote[] {
  return notes
    .map((note) => mutateNote(note, operation))
    .filter((n): n is ParsedNote => n !== null)
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
  }

  for (const note of notes) {
    const mutated = mutateNote(note, operation)
    if (!mutated) continue
    try {
      await writeNote(mutated, defs)
      result.succeeded++
    } catch (err) {
      result.failed++
      result.errors.push({ filePath: note.filePath, error: String(err) })
    }
  }

  return result
}
