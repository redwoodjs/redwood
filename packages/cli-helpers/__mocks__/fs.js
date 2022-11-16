import { isString } from 'lodash'

const fs = {
  ...jest.requireActual('fs'),
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
  // In prisma v4.3.0, prisma format uses a Wasm module. See https://github.com/prisma/prisma/releases/tag/4.3.0.
  // We shouldn't mock this, so we'll use the real fs.readFileSync.
  if (path.includes('prisma_fmt_build_bg.wasm')) {
    return jest.requireActual('fs').readFileSync(path)
  }

  return mockFiles[path]
}

fs.writeFileSync = (path, contents) => {
  mockFiles[path] = contents
}

fs.unlinkSync = (path) => {
  delete mockFiles[path]
}

module.exports = fs
