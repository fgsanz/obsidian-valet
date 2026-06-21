import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ForbiddenDirTag from '../../src/client/components/ForbiddenDirTag'

afterEach(cleanup)

test('ForbiddenDirTag: shows the directory name', () => {
  render(<ForbiddenDirTag dir="Dir 2/Subdir 2.1" onRemove={() => {}} />)
  assert.ok(screen.getByText('Dir 2/Subdir 2.1'))
})

test('ForbiddenDirTag: hovering the remove icon turns the whole chip red', () => {
  const { container } = render(<ForbiddenDirTag dir="Dir 1" onRemove={() => {}} />)
  const tag = container.firstChild as HTMLElement
  const remove = screen.getByLabelText('Remove Dir 1')
  assert.ok(!tag.className.includes('tagDanger'))
  fireEvent.mouseEnter(remove)
  assert.ok(tag.className.includes('tagDanger'))
  fireEvent.mouseLeave(remove)
  assert.ok(!tag.className.includes('tagDanger'))
})

test('ForbiddenDirTag: clicking the remove icon calls onRemove', () => {
  let removed = false
  render(<ForbiddenDirTag dir="Dir 1" onRemove={() => { removed = true }} />)
  fireEvent.click(screen.getByLabelText('Remove Dir 1'))
  assert.ok(removed)
})
