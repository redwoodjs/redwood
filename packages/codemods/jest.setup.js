const fs = require('fs')

global.matchTransformSnapshot =
  require('./src/testUtils/matchTransformSnapshot').matchTransformSnapshot
global.matchInlineTransformSnapshot =
  require('./src/testUtils/matchInlineTransformSnapshot').matchInlineTransformSnapshot
global.matchFolderTransform =
  require('./src/testUtils/matchFolderTransform').matchFolderTransform

// Custom matcher for checking fixtures using paths
// e.g. expect(transformedPath).toMatchFixture(expectedPath)
// Mainly so we throw more helpful errors
expect.extend({
  toMatchFixture(received, expected) {
    let pass = true
    let message = ''
    try {
      const actualOutput = fs.readFileSync(received, 'utf-8')
      const expectedOutput = fs.readFileSync(expected, 'utf-8')

      expect(actualOutput).toEqual(expectedOutput)
    } catch (e) {
      pass = false
      message = `${e}\nFixtures do not match for: ${expected}`
    }
    return {
      pass,
      message: () => message,
      expected,
      received,
    }
  },
})
