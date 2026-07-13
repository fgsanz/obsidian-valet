import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { NoteSummary, Vault } from '@shared/types'
import ContentPage from '../../src/client/pages/ContentPage'

afterEach(cleanup)

const VAULT: Vault = {
  id: 'v1',
  name: 'test',
  path: '/x',
  forbiddenDirs: [],
  properties: [{ name: 'category', type: 'text' }],
}
const NOTES: NoteSummary[] = [
  { title: 'Agile - Kindle highlights', relativePath: 'Books/Agile - Kindle highlights.md', dir: 'Books', isKindle: true, highlightsCount: 187 },
  { title: 'Plain note', relativePath: 'Plain note.md', dir: '', isKindle: false, highlightsCount: null },
]

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  })
  // Seed the queries the page reads, so nothing hits the network in jsdom.
  qc.setQueryData(['vaults', 'active'], VAULT)
  qc.setQueryData(['git', 'status', 'v1'], { hasGit: true, isDirty: false, stagedCount: 0, unstagedCount: 0 })
  qc.setQueryData(['notes', 'list', 'v1'], NOTES)
  qc.setQueryData(['vault', 'directories', 'v1'], ['Books'])
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ContentPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('ContentPage: renders both tabs, Kindle active', () => {
  renderPage()
  assert.ok(screen.getByText('Kindle highlights split'))
  assert.ok(screen.getByText('Audible splits'))
})

test('ContentPage: the Audible tab is an empty placeholder', () => {
  renderPage()
  fireEvent.click(screen.getByText('Audible splits'))
  assert.ok(screen.getByText(/intentionally empty/))
})

test('ContentPage: choosing a non-Kindle note shows the blocking banner', () => {
  renderPage()
  fireEvent.change(screen.getByPlaceholderText('Type a note name…'), { target: { value: 'Plain note' } })
  assert.ok(screen.getByText(/Not a Kindle highlights note/))
})

test('ContentPage: choosing a Kindle note confirms it and shows the highlight count', () => {
  renderPage()
  fireEvent.change(screen.getByPlaceholderText('Type a note name…'), {
    target: { value: 'Agile - Kindle highlights' },
  })
  assert.ok(screen.getByText(/187 highlights/))
  // The prefix defaults to the chosen note's name, so both the picker and the prefix field show it.
  assert.ok(screen.getAllByDisplayValue('Agile - Kindle highlights').length >= 2)
})
