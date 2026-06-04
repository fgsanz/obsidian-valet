import { Given } from '@cucumber/cucumber'
import type { ValetWorld } from '../../support/world'

/**
 * The Before hook already copies the fixture and scans it. This step makes the dependency
 * explicit in the feature file and resets any filter state so a scenario reads top-to-bottom.
 */
Given('a fresh copy of the dummy vault', async function (this: ValetWorld) {
  this.criteria = { location: [], properties: [] }
  this.matched = []
  this.result = null
  await this.scan()
})
