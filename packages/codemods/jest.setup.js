const fs = require('fs')
const path = require('path')

global.matchTransformSnapshot =
  require('./src/testUtils/matchTransformSnapshot').matchTransformSnapshot
global.matchInlineTransformSnapshot =
  require('./src/testUtils/matchInlineTransformSnapshot').matchInlineTransformSnapshot
global.matchFolderTransform =
  require('./src/testUtils/matchFolderTransform').matchFolderTransform

// Custom matcher for checking fixtures using paths
// e.g. expect(transformedPath).toMatchFileContents(expectedPath)
// Mainly so we throw more helpful errors
expect.extend({
  toMatchFileContents(receivedPath, expectedPath) {
    let pass = true
    let message = ''
    try {
      const actualOutput = fs.readFileSync(receivedPath, 'utf-8')
      const expectedOutput = fs.readFileSync(expectedPath, 'utf-8')

      expect(actualOutput).toEqual(expectedOutput)
    } catch (e) {
      const relativePath = path.relative(
        path.join(__dirname, 'src/codemods'),
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
