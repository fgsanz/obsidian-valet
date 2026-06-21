/**
 * Whether the user's typed confirmation matches the required word (used to gate destructive,
 * irreversible actions behind a type-to-confirm input). Trimmed, but case-sensitive and exact.
 */
export function matchesRequiredText(typed: string, requireText: string): boolean {
  return typed.trim() === requireText
}
