import type { Vault, ParsedNote, FilterRule, Operation, OperationResult, GitStatus, DocPage, ApiResponse, PropertyDef } from '@shared/types'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json()) as ApiResponse<T>
  if (json.error) throw new Error(json.error.message)
  return json.data as T
}

export const api = {
  vaults: {
    list: () => request<Vault[]>('GET', '/vaults'),
    create: (data: Omit<Vault, 'id'>) => request<Vault>('POST', '/vaults', data),
    update: (id: string, data: Partial<Omit<Vault, 'id'>>) =>
      request<Vault>('PATCH', `/vaults/${id}`, data),
    remove: (id: string) => request<null>('DELETE', `/vaults/${id}`),
    getActive: () => request<Vault | null>('GET', '/vaults/active'),
    setActive: (vaultId: string) => request<null>('PUT', '/vaults/active', { vaultId }),
    discoverProperties: (id: string) =>
      request<PropertyDef[]>('POST', `/vaults/${id}/discover-properties`),
  },

  fs: {
    browseFolder: () => request<{ path: string | null }>('POST', '/browse-folder'),
    listDirectories: (path: string) =>
      request<string[]>('POST', '/list-directories', { path }),
  },

  notes: {
    scan: (vaultId: string) => request<{ count: number }>('POST', '/notes/scan', { vaultId }),
    filter: (vaultId: string, rules: FilterRule[]) =>
      request<ParsedNote[]>('POST', '/notes/filter', { vaultId, rules }),
    previewOperation: (vaultId: string, rules: FilterRule[], operation: Operation) =>
      request<ParsedNote[]>('POST', '/notes/preview-operation', { vaultId, rules, operation }),
    applyOperation: (
      vaultId: string,
      rules: FilterRule[],
      operation: Operation,
      commitMessage?: string,
    ) =>
      request<OperationResult>('POST', '/notes/apply-operation', {
        vaultId,
        rules,
        operation,
        commitMessage,
      }),
  },

  git: {
    status: (vaultId: string) => request<GitStatus>('GET', `/git/${vaultId}/status`),
    commit: (vaultId: string, message: string) =>
      request<{ sha: string }>('POST', `/git/${vaultId}/commit`, { message }),
    suggestMessage: (vaultId: string, context: string) =>
      request<{ message: string }>('GET', `/git/${vaultId}/suggest-message?context=${encodeURIComponent(context)}`),
  },

  docs: {
    list: () => request<DocPage[]>('GET', '/docs'),
    get: (slug: string) => request<{ title: string; content: string }>('GET', `/docs/${slug}`),
  },
}
