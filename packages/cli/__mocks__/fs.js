const fs = {
  ...jest.requireActual('fs'),
}

/**
 * This is a custom function that our tests can use during setup to specify
 * what the files on the "mock" filesystem should look like when any of the
 * `fs` APIs are used.
 */
let mockFiles = {}

/**
 * Sets the state of the mocked file system
 * @param newMockFiles - {[filepath]: contents}
 */
fs.__setMockFiles = (newMockFiles) => {
  mockFiles = { ...newMockFiles }
}

fs.readFileSync = (path) => {
  // In prisma v4.3.0, prisma format uses a Wasm module. See https://github.com/prisma/prisma/releases/tag/4.3.0.
  // We shouldn't mock this, so we'll use the real fs.readFileSync.
  if (path.includes('prisma_fmt_build_bg.wasm')) {
    return jest.requireActual('fs').readFileSync(path)
  }

  if (path in mockFiles) {
    return mockFiles[path]
  } else {
    const fakeError = new Error(
      `Error: ENOENT: no such file or directory, open '${path}'`
    )
    fakeError.errno = -2
    fakeError.syscall = 'open'
    fakeError.code = 'ENOENT'
    fakeError.path = path
    throw fakeError
  }
}

fs.writeFileSync = (path, contents) => {
  mockFiles[path] = contents
}

fs.appendFileSync = (path, contents) => {
  if (path in mockFiles) {
    mockFiles[path] = mockFiles[path] + contents
  } else {
    mockFiles[path] = contents
  }
}

fs.rmSync = (path) => {
  if (path in mockFiles) {
    delete mockFiles[path]
  } else {
    const fakeError = new Error(
      `Error: ENOENT: no such file or directory, stat '${path}'`
    )
    fakeError.errno = -2
    fakeError.syscall = 'stat'
    fakeError.code = 'ENOENT'
    fakeError.path = path
    throw fakeError
  }
}

fs.unlinkSync = (path) => {
  if (path in mockFiles) {
    delete mockFiles[path]
  } else {
    const fakeError = new Error(
      `Error: ENOENT: no such file or directory, stat '${path}'`
    )
    fakeError.errno = -2
    fakeError.syscall = 'unlink'
    fakeError.code = 'ENOENT'
    fakeError.path = path
    throw fakeError
  }
}

fs.existsSync = (path) => {
  return path in mockFiles
}

fs.copyFileSync = (src, dist) => {
  fs.writeFileSync(dist, fs.readFileSync(src))
}

// fs.readdirSync = (path) => {
//   const mockedFiles = []
//   Object.keys(mockFiles).forEach((mockedPath) => {
//     // Is a child of the desired path
//     if (mockedPath.startsWith(path)) {
//       const childPath = mockedPath.substring(path.length + 1)
//       // Is the child a direct child of the desired path
//       if (!childPath.includes(sep)) {
//         mockedFiles.push(childPath)
//       }
//     }
//   })
//   return mockedFiles
// }

// fs.mkdirSync = () => {}

// // @MARK this works for now but should probably be a little more full-featured
// fs.rmdirSync = (path) => {
//   delete mockFiles[path]
// }

module.exports = fs
