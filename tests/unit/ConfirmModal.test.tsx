import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ConfirmModal from '../../src/client/components/ConfirmModal'

afterEach(cleanup)

const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

test('ConfirmModal: confirm is enabled and fires when there is no required text', () => {
  let confirmed = false
  render(<ConfirmModal title="Delete?" message="Sure?" confirmLabel="Delete" onConfirm={() => { confirmed = true }} onCancel={() => {}} />)
  const confirm = button('Delete')
  assert.equal(confirm.disabled, false)
  fireEvent.click(confirm)
  assert.ok(confirmed)
})

test('ConfirmModal: cancel fires onCancel', () => {
  let cancelled = false
  render(<ConfirmModal title="Delete?" message="Sure?" onConfirm={() => {}} onCancel={() => { cancelled = true }} />)
  fireEvent.click(button('Cancel'))
  assert.ok(cancelled)
})

test('ConfirmModal: Escape fires onCancel', () => {
  let cancelled = false
  render(<ConfirmModal title="Delete?" message="Sure?" onConfirm={() => {}} onCancel={() => { cancelled = true }} />)
  fireEvent.keyDown(document.body, { key: 'Escape' })
  assert.ok(cancelled)
})

test('ConfirmModal: type-to-confirm keeps confirm disabled until the text matches exactly', () => {
  render(
    <ConfirmModal
      title="Important"
      message="Type revert to confirm"
      requireText="revert"
      inputLabel="Confirmation"
      confirmLabel="Revert changes"
      onConfirm={() => {}}
      onCancel={() => {}}
    />,
  )
  const confirm = button('Revert changes')
  const input = screen.getByRole('textbox')
  assert.equal(confirm.disabled, true)
  fireEvent.change(input, { target: { value: 'rev' } })
  assert.equal(confirm.disabled, true)
  fireEvent.change(input, { target: { value: 'revert' } })
  assert.equal(confirm.disabled, false)
})

test('ConfirmModal: type-to-confirm only fires onConfirm once enabled', () => {
  let confirmed = false
  render(
    <ConfirmModal
      title="Important"
      message="Type revert"
      requireText="revert"
      confirmLabel="Revert changes"
      onConfirm={() => { confirmed = true }}
      onCancel={() => {}}
    />,
  )
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'revert' } })
  fireEvent.click(button('Revert changes'))
  assert.ok(confirmed)
})
