import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as vitePluginRemoveFromBundle from '../vite-plugin-remove-from-bundle.js'

// @ts-expect-error We have to write it this way to appeas node:test, but TS doesn't seem to like it.
const { getShouldExclude } = vitePluginRemoveFromBundle.default

describe('excludeModule', () => {
  it('should return true if idToExclude matches id', () => {
    const shouldExcludeModule = getShouldExclude({
      id: './splash-page',
      idToExclude: /splash-page/,
    })

    assert.equal(shouldExcludeModule, true)
  })

  it("should return false if idToExclude doesn't match id", () => {
    const shouldExcludeModule = getShouldExclude({
      id: './splash-page',
      idToExclude: /bazinga-page/,
    })

    assert.equal(shouldExcludeModule, false)
  })

  it('should return true if idToExclude matches id and parentIdToExclude matches parentId ', () => {
    const shouldExcludeModule = getShouldExclude({
      id: './splash-page',
      parentId: '/redwood-app/node_modules/@redwoodjs/router/dist/router.js',
      idToExclude: /splash-page/,
      parentIdToExclude: /@redwoodjs\/router/,
    })

    assert.equal(shouldExcludeModule, true)
  })

  it("should return false if parentIdToExclude is specified but there's no parentId", () => {
    const shouldExcludeModule = getShouldExclude({
      id: './splash-page',
      idToExclude: /splash-page/,
      parentIdToExclude: /@redwoodjs\/router/,
    })

    assert.equal(shouldExcludeModule, false)
  })
})
