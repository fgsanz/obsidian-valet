import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sortVaultsActiveFirst } from '../../src/shared/vaults'
import type { Vault } from '../../src/shared/types'

function makeVault(id: string): Vault {
  return { id, name: id, path: `/vaults/${id}`, forbiddenDirs: [], properties: [] }
}

const ids = (vaults: Vault[]) => vaults.map((v) => v.id)

test('sortVaultsActiveFirst: moves the active vault to the top', () => {
  const vaults = [makeVault('a'), makeVault('b'), makeVault('c')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, 'c')), ['c', 'a', 'b'])
})

test('sortVaultsActiveFirst: preserves the relative order of the non-active vaults', () => {
  const vaults = [makeVault('a'), makeVault('b'), makeVault('c'), makeVault('d')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, 'b')), ['b', 'a', 'c', 'd'])
})

test('sortVaultsActiveFirst: active vault already first stays first', () => {
  const vaults = [makeVault('a'), makeVault('b')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, 'a')), ['a', 'b'])
})

test('sortVaultsActiveFirst: a single vault that is active is unchanged', () => {
  const vaults = [makeVault('only')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, 'only')), ['only'])
})

test('sortVaultsActiveFirst: a single vault with no active selection is unchanged', () => {
  const vaults = [makeVault('only')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, null)), ['only'])
})

test('sortVaultsActiveFirst: no active id keeps the original order', () => {
  const vaults = [makeVault('a'), makeVault('b'), makeVault('c')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, null)), ['a', 'b', 'c'])
})

test('sortVaultsActiveFirst: an active id not in the list keeps the original order', () => {
  const vaults = [makeVault('a'), makeVault('b')]
  assert.deepEqual(ids(sortVaultsActiveFirst(vaults, 'missing')), ['a', 'b'])
})

test('sortVaultsActiveFirst: an empty list returns an empty list', () => {
  assert.deepEqual(sortVaultsActiveFirst([], 'a'), [])
})

test('sortVaultsActiveFirst: does not mutate the input array', () => {
  const vaults = [makeVault('a'), makeVault('b'), makeVault('c')]
  sortVaultsActiveFirst(vaults, 'c')
  assert.deepEqual(ids(vaults), ['a', 'b', 'c'])
})
