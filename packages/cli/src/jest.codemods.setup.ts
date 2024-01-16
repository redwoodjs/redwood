/* eslint-env node, jest */

import { formatCode } from './testUtils'

// Disable telemetry within framework tests
process.env.REDWOOD_DISABLE_TELEMETRY = 1

const fs = require('fs')
const path = require('path')

globalThis.matchTransformSnapshot =
  require('./testUtils/matchTransformSnapshot').matchTransformSnapshot
globalThis.matchInlineTransformSnapshot =
  require('./testUtils/matchInlineTransformSnapshot').matchInlineTransformSnapshot
globalThis.matchFolderTransform =
  require('./testUtils/matchFolderTransform').matchFolderTransform

// Custom matcher for checking fixtures using paths
// e.g. expect(transformedPath).toMatchFileContents(expectedPath)
// Mainly so we throw more helpful errors
expect.extend({
  toMatchFileContents(
    receivedPath,
    expectedPath,
    { removeWhitespace } = { removeWhitespace: false }
  ) {
    let pass = true
    let message = ''
    try {
      let actualOutput = fs.readFileSync(receivedPath, 'utf-8')
      let expectedOutput = fs.readFileSync(expectedPath, 'utf-8')

      if (removeWhitespace) {
        actualOutput = actualOutput.replace(/\s/g, '')
        expectedOutput = expectedOutput.replace(/\s/g, '')
      }

      expect(formatCode(actualOutput)).toEqual(formatCode(expectedOutput))
    } catch (e) {
      const relativePath = path.relative(
        path.join(__dirname, 'src/commands/setup'),
        expectedPath
      )
      pass = false
      message = `${e}\nFile contents do not match for fixture at: \n ${relativePath}`
    }

    return {
      pass,
      message: () => message,
      expected: expectedPath,
      received: receivedPath,
    }
  },
})
