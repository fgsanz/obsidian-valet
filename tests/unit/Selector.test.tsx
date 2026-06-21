import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Selector from '../../src/client/components/Selector'

afterEach(cleanup)

test('Selector: shows the placeholder', () => {
  render(<Selector value="" onChange={() => {}} options={['a', 'b']} placeholder="select property" />)
  assert.ok(screen.getByPlaceholderText('select property'))
})

test('Selector: opens the options on focus', () => {
  render(<Selector value="" onChange={() => {}} options={['alpha', 'beta']} />)
  fireEvent.focus(screen.getByRole('textbox'))
  assert.ok(screen.getByText('alpha'))
  assert.ok(screen.getByText('beta'))
})

test('Selector: filters the options by the current value', () => {
  render(<Selector value="al" onChange={() => {}} options={['alpha', 'beta']} />)
  fireEvent.focus(screen.getByRole('textbox'))
  assert.ok(screen.queryByText('alpha'))
  assert.equal(screen.queryByText('beta'), null)
})

test('Selector: choosing an option reports it', () => {
  let chosen = ''
  render(<Selector value="" onChange={(v) => { chosen = v }} options={['alpha', 'beta']} />)
  fireEvent.focus(screen.getByRole('textbox'))
  fireEvent.pointerDown(screen.getByText('beta'))
  assert.equal(chosen, 'beta')
})

test('Selector: typing reports the new value', () => {
  let latest = ''
  render(<Selector value="" onChange={(v) => { latest = v }} options={['alpha']} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } })
  assert.equal(latest, 'xyz')
})

test('Selector: empty message when nothing matches', () => {
  render(<Selector value="zzz" onChange={() => {}} options={['alpha']} emptyMessage="No matching property" />)
  fireEvent.focus(screen.getByRole('textbox'))
  assert.ok(screen.getByText('No matching property'))
})

test('Selector: clear button only with a value, and clears it', () => {
  let cleared: string | null = null
  const { rerender } = render(<Selector value="" onChange={(v) => { cleared = v }} options={['alpha']} />)
  assert.equal(screen.queryByLabelText('Clear selection'), null)
  rerender(<Selector value="alpha" onChange={(v) => { cleared = v }} options={['alpha']} />)
  fireEvent.pointerDown(screen.getByLabelText('Clear selection'))
  assert.equal(cleared, '')
})

test('Selector: hovering the clear icon tints the field', () => {
  render(<Selector value="alpha" onChange={() => {}} options={['alpha']} />)
  const input = screen.getByRole('textbox')
  fireEvent.mouseEnter(screen.getByLabelText('Clear selection'))
  assert.ok(input.className.includes('inputClearHover'))
})
