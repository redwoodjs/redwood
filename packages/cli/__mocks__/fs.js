import { isString } from 'lodash'

const fs = {
  ...require.requireActual('fs'),
}

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles = {}
/** @param newMockFiles - {[filepath]: contents} */
fs.__setMockFiles = (newMockFiles) => {
  mockFiles = { ...newMockFiles }
}

fs.existsSync = (path) => {
  return isString(mockFiles[path])
}

fs.mkdirSync = () => {}

fs.readFileSync = (path) => {
  return mockFiles[path]
}

fs.writeFileSync = (path, contents) => {
  mockFiles[path] = contents
}

fs.unlinkSync = (path) => {
  delete mockFiles[path]
}

module.exports = fs
