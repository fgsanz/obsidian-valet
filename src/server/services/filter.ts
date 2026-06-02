import type { ParsedNote, FilterRule, PropertyDef, PropertyType, LocationRule, PropertyRule, FilterCriteria } from '@shared/types'
import { normalizeLinkTarget } from './frontmatter'

function getPropertyType(property: string, defs: PropertyDef[]): PropertyType {
  return defs.find((d) => d.name === property)?.type ?? 'text'
}

function parseISOWeek(weekLink: string): Date | null {
  const m = weekLink.match(/\[?\[?(\d{4})-W(\d{1,2})\]?\]?/)
  if (!m) return null
  const year = parseInt(m[1], 10)
  const week = parseInt(m[2], 10)
  const jan4 = new Date(year, 0, 4)
  const startOfWeek = new Date(jan4)
  startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  return startOfWeek
}

function matchesOperator(
  rawValue: unknown,
  operator: FilterRule['operator'],
  query: string,
  type: PropertyType,
  caseSensitive: boolean = false,
): boolean {
  if (rawValue == null) {
    return operator === 'not-equals' || operator === 'not-contains'
  }

  const q = query.trim()

  switch (type) {
    case 'link-array':
    case 'link': {
      const links: string[] = Array.isArray(rawValue)
        ? rawValue.map(String)
        : [String(rawValue)]
      const qNorm = caseSensitive
        ? normalizeLinkTarget(q)
        : normalizeLinkTarget(q).toLowerCase()
      const anyMatch = links.some((link) => {
        const norm = caseSensitive
          ? normalizeLinkTarget(link)
          : normalizeLinkTarget(link).toLowerCase()
        const aliasMatch = link.includes('|')
          ? caseSensitive
            ? link
                .replace(/^\[\[/, '')
                .replace(/\]\]$/, '')
                .split('|')[1]
                ?.trim() === qNorm
            : link
                .replace(/^\[\[/, '')
                .replace(/\]\]$/, '')
                .split('|')[1]
                ?.trim()
                .toLowerCase() === qNorm
          : false
        return norm === qNorm || aliasMatch
      })
      if (operator === 'contains') return anyMatch
      if (operator === 'not-contains') return !anyMatch
      if (operator === 'equals') return links.length === 1 && anyMatch
      if (operator === 'not-equals') return !(links.length === 1 && anyMatch)
      return false
    }

    case 'tag-array': {
      const tags: string[] = Array.isArray(rawValue) ? rawValue.map(String) : [String(rawValue)]
      const qNorm = caseSensitive
        ? q.replace(/^#/, '')
        : q.replace(/^#/, '').toLowerCase()
      const anyMatch = caseSensitive
        ? tags.some((tag) => tag.startsWith(qNorm))
        : tags.some((tag) => tag.toLowerCase().startsWith(qNorm))
      if (operator === 'contains') return anyMatch
      if (operator === 'not-contains') return !anyMatch
      if (operator === 'equals') return caseSensitive
        ? tags.some((t) => t === qNorm)
        : tags.some((t) => t.toLowerCase() === qNorm)
      if (operator === 'not-equals') return caseSensitive
        ? !tags.some((t) => t === qNorm)
        : !tags.some((t) => t.toLowerCase() === qNorm)
      return false
    }

    case 'text-array': {
      const arr: string[] = Array.isArray(rawValue) ? rawValue.map(String) : [String(rawValue)]
      if (caseSensitive) {
        if (operator === 'contains') return arr.some((v) => v.includes(q))
        if (operator === 'not-contains') return !arr.some((v) => v.includes(q))
        if (operator === 'equals') return arr.some((v) => v === q)
        if (operator === 'not-equals') return !arr.some((v) => v === q)
      } else {
        const qLow = q.toLowerCase()
        if (operator === 'contains') return arr.some((v) => v.toLowerCase().includes(qLow))
        if (operator === 'not-contains') return !arr.some((v) => v.toLowerCase().includes(qLow))
        if (operator === 'equals') return arr.some((v) => v.toLowerCase() === qLow)
        if (operator === 'not-equals') return !arr.some((v) => v.toLowerCase() === qLow)
      }
      return false
    }

    case 'date': {
      const val = new Date(String(rawValue))
      const cmp = new Date(q)
      if (isNaN(val.getTime()) || isNaN(cmp.getTime())) return false
      if (operator === 'equals') return val.getTime() === cmp.getTime()
      if (operator === 'not-equals') return val.getTime() !== cmp.getTime()
      if (operator === 'before') return val < cmp
      if (operator === 'after') return val > cmp
      return false
    }

    case 'week-link': {
      const val = parseISOWeek(String(rawValue))
      const cmp = parseISOWeek(q)
      if (!val || !cmp) return false
      if (operator === 'equals') return val.getTime() === cmp.getTime()
      if (operator === 'not-equals') return val.getTime() !== cmp.getTime()
      if (operator === 'before') return val < cmp
      if (operator === 'after') return val > cmp
      return false
    }

    case 'number': {
      const val = Number(rawValue)
      const cmp = Number(q)
      if (isNaN(val) || isNaN(cmp)) return false
      if (operator === 'equals') return val === cmp
      if (operator === 'not-equals') return val !== cmp
      if (operator === 'before') return val < cmp
      if (operator === 'after') return val > cmp
      return false
    }

    default: {
      const val = caseSensitive ? String(rawValue) : String(rawValue).toLowerCase()
      const qVal = caseSensitive ? q : q.toLowerCase()
      if (operator === 'equals') return val === qVal
      if (operator === 'not-equals') return val !== qVal
      if (operator === 'contains') return val.includes(qVal)
      if (operator === 'not-contains') return !val.includes(qVal)
      return false
    }
  }
}

function noteMatchesDirectory(note: ParsedNote, rule: FilterRule): boolean {
  const rel = note.relativePath.replace(/\\/g, '/')
  const noteDir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : ''
  const targetDir = rule.property.replace(/\\/g, '/').replace(/\/$/, '')

  const isIn = noteDir === targetDir || noteDir.startsWith(targetDir + '/')
  return rule.operator === 'equals' ? isIn : !isIn
}

function noteMatchesRule(note: ParsedNote, rule: FilterRule, defs: PropertyDef[]): boolean {
  if (rule.kind === 'directory') return noteMatchesDirectory(note, rule)
  const type = getPropertyType(rule.property, defs)
  const value = note.frontmatter[rule.property]
  return matchesOperator(value, rule.operator, rule.value, type)
}

export function filterNotes(
  notes: ParsedNote[],
  rules: FilterRule[],
  defs: PropertyDef[],
): ParsedNote[] {
  if (rules.length === 0) return notes

  let result: ParsedNote[] = []

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const matched = notes.filter((note) => noteMatchesRule(note, rule, defs))

    if (i === 0) {
      result = matched
    } else if (rule.combinator === 'and') {
      const matchedPaths = new Set(matched.map((n) => n.filePath))
      result = result.filter((n) => matchedPaths.has(n.filePath))
    } else {
      const existingPaths = new Set(result.map((n) => n.filePath))
      for (const note of matched) {
        if (!existingPaths.has(note.filePath)) result.push(note)
      }
    }
  }

  return result
}

function noteMatchesLocationRule(note: ParsedNote, rule: LocationRule): boolean {
  const rel = note.relativePath.replace(/\\/g, '/')
  const noteDir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : ''

  if (rule.operator === 'all-directories') return true
  const targetDir = rule.directory ? rule.directory.replace(/\\/g, '/').replace(/\/$/, '') : ''
  const isIn = noteDir === targetDir || noteDir.startsWith(targetDir + '/')
  return rule.operator === 'directory-is' ? isIn : !isIn
}

function locationRulesList(
  notes: ParsedNote[],
  rules: LocationRule[],
): ParsedNote[] {
  if (rules.length === 0) return notes

  let result: ParsedNote[] = []

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const matched = notes.filter((note) => noteMatchesLocationRule(note, rule))

    if (i === 0) {
      result = matched
    } else if (rule.combinator === 'and') {
      const matchedPaths = new Set(matched.map((n) => n.filePath))
      result = result.filter((n) => matchedPaths.has(n.filePath))
    } else {
      const existingPaths = new Set(result.map((n) => n.filePath))
      for (const note of matched) {
        if (!existingPaths.has(note.filePath)) result.push(note)
      }
    }
  }

  return result
}

function noteMatchesPropertyRule(note: ParsedNote, rule: PropertyRule, defs: PropertyDef[]): boolean {
  const hasProperty = Object.hasOwn(note.frontmatter, rule.property)

  if (rule.operator === 'does-not-exist') {
    return !hasProperty
  }

  if (rule.operator === 'exists-and-empty') {
    if (!hasProperty) return false
    const value = note.frontmatter[rule.property]
    return value == null || (Array.isArray(value) && value.length === 0)
  }

  // For 'contains' and 'not-contains', property must exist
  if (!hasProperty) {
    return false
  }

  const type = getPropertyType(rule.property, defs)
  const value = note.frontmatter[rule.property]
  const query = rule.value ?? ''
  const caseSensitive = rule.caseSensitive ?? false

  if (rule.operator === 'contains') {
    return matchesOperator(value, 'contains', query, type, caseSensitive)
  } else if (rule.operator === 'not-contains') {
    return matchesOperator(value, 'not-contains', query, type, caseSensitive)
  }

  return false
}

function filterPropertyRules(
  notes: ParsedNote[],
  rules: PropertyRule[],
  defs: PropertyDef[],
): ParsedNote[] {
  if (rules.length === 0) return notes

  let result: ParsedNote[] = []

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const matched = notes.filter((note) => noteMatchesPropertyRule(note, rule, defs))

    if (i === 0) {
      result = matched
    } else if (rule.combinator === 'and') {
      const matchedPaths = new Set(matched.map((n) => n.filePath))
      result = result.filter((n) => matchedPaths.has(n.filePath))
    } else {
      const existingPaths = new Set(result.map((n) => n.filePath))
      for (const note of matched) {
        if (!existingPaths.has(note.filePath)) result.push(note)
      }
    }
  }

  return result
}

export function filterByCriteria(
  notes: ParsedNote[],
  criteria: FilterCriteria,
  defs: PropertyDef[],
): ParsedNote[] {
  let result = notes

  if (criteria.location.length > 0) {
    result = locationRulesList(result, criteria.location)
  }

  if (criteria.properties.length > 0) {
    result = filterPropertyRules(result, criteria.properties, defs)
  }

  return result
}
