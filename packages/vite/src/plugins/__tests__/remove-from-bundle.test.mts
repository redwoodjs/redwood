import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as vitePluginRemoveFromBundle from '../vite-plugin-remove-from-bundle.js'

// @ts-expect-error We have to write it this way to appease node:test, but TS doesn't seem to like it.
// node:test needs to be configured correctly, I imagine.
const { excludeOnMatch } = vitePluginRemoveFromBundle.default

describe('excludeModule', () => {
  it('should return true if idToExclude matches id', () => {
    const loadOutput = excludeOnMatch([{
      id: /router\/dist\/splash-page/,
    }],
    '/Users/dac09/Experiments/splash-page-null-loader/node_modules/@redwoodjs/router/dist/splash-page.js?commonjs-exports',
    )

    assert.notStrictEqual(loadOutput, {
      code: 'module.exports = null'
    })
  })

  it("should return false if idToExclude doesn't match id", () => {
    const loadOutput = excludeOnMatch([{
      id: /bazinga-page/,
    }],
    '/Users/dac09/Experiments/splash-page-null-loader/node_modules/@redwoodjs/router/dist/params.js')

    assert.equal(loadOutput, null)
  })
})
