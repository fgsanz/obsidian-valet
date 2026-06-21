import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ValueInput from '../../src/client/components/ValueInput'

afterEach(cleanup)

test('ValueInput: no clear button when the field is empty', () => {
  render(<ValueInput value="" onChange={() => {}} />)
  assert.equal(screen.queryByLabelText('Clear value'), null)
})

test('ValueInput: shows a clear button when there is a value', () => {
  render(<ValueInput value="hello" onChange={() => {}} />)
  assert.ok(screen.getByLabelText('Clear value'))
})

test('ValueInput: clicking clear empties the value', () => {
  let cleared: string | null = null
  render(<ValueInput value="hello" onChange={(v) => { cleared = v }} />)
  fireEvent.pointerDown(screen.getByLabelText('Clear value'))
  assert.equal(cleared, '')
})

test('ValueInput: hovering the clear icon tints the field (red hover cue)', () => {
  render(<ValueInput value="hello" onChange={() => {}} />)
  const input = screen.getByRole('textbox')
  assert.ok(!input.className.includes('inputClearHover'))
  fireEvent.mouseEnter(screen.getByLabelText('Clear value'))
  assert.ok(input.className.includes('inputClearHover'))
  fireEvent.mouseLeave(screen.getByLabelText('Clear value'))
  assert.ok(!input.className.includes('inputClearHover'))
})

test('ValueInput: the invalid prop highlights the field', () => {
  render(<ValueInput value="x" onChange={() => {}} invalid />)
  assert.ok(screen.getByRole('textbox').className.includes('inputInvalid'))
})

test('ValueInput: typing reports the new value', () => {
  let latest = ''
  render(<ValueInput value="" onChange={(v) => { latest = v }} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
  assert.equal(latest, 'abc')
})
