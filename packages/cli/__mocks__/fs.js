import path from 'path'

const fs = {
  ...jest.requireActual('fs'),
}

let mockFiles = {}

const pathSeparator = path.sep

const getParentDir = (path) => {
  return path.substring(0, path.lastIndexOf(pathSeparator))
}

const makeParentDirs = (path) => {
  const parentDir = getParentDir(path)
  if (parentDir && !(parentDir in mockFiles)) {
    mockFiles[parentDir] = undefined
    makeParentDirs(parentDir)
  }
}

/**
 * This is a custom function that our tests can use during setup to specify
 * what the files on the "mock" filesystem should look like when any of the
 * `fs` APIs are used.
 *
 * Sets the state of the mocked file system
 * @param newMockFiles - {[filepath]: contents}
 */
fs.__setMockFiles = (newMockFiles) => {
  mockFiles = { ...newMockFiles }

  // Generate all the directories which implicitly exist
  Object.keys(mockFiles).forEach((mockPath) => {
    if (mockPath.includes(pathSeparator)) {
      makeParentDirs(mockPath)
    }
  })
}

fs.__getMockFiles = () => {
  return mockFiles
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
  const parentDir = getParentDir(path)
  if (parentDir && !fs.existsSync(parentDir)) {
    const fakeError = new Error(
      `Error: ENOENT: no such file or directory, open '${path}'`
    )
    fakeError.errno = -2
    fakeError.syscall = 'open'
    fakeError.code = 'ENOENT'
    fakeError.path = path
    throw fakeError
  }
  mockFiles[path] = contents
}

fs.appendFileSync = (path, contents) => {
  if (path in mockFiles) {
    mockFiles[path] = mockFiles[path] + contents
  } else {
    fs.writeFileSync(path, contents)
  }
}

fs.rmSync = (path, options = {}) => {
  if (fs.existsSync(path)) {
    if (options.recursive) {
      Object.keys(mockFiles).forEach((mockedPath) => {
        if (mockedPath.startsWith(path)) {
          delete mockFiles[mockedPath]
        }
      })
    } else {
      if (mockFiles[path] === undefined) {
        const children = fs.readdirSync(path)
        if (children.length !== 0) {
          const fakeError = new Error(
            `NodeError [SystemError]: Path is a directory: rm returned EISDIR (is a directory) ${path}`
          )
          fakeError.errno = 21
          fakeError.syscall = 'rm'
          fakeError.code = 'ERR_FS_EISDIR'
          fakeError.path = path
          throw fakeError
        }
      }
      delete mockFiles[path]
    }
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

fs.readdirSync = (path) => {
  if (!fs.existsSync(path)) {
    const fakeError = new Error(
      `Error: ENOENT: no such file or directory, scandir '${path}'`
    )
    fakeError.errno = -2
    fakeError.syscall = 'scandir'
    fakeError.code = 'ENOENT'
    fakeError.path = path
    throw fakeError
  }

  if (mockFiles[path] !== undefined) {
    const fakeError = new Error(
      `Error: ENOTDIR: not a directory, scandir '${path}'`
    )
    fakeError.errno = -20
    fakeError.syscall = 'scandir'
    fakeError.code = 'ENOTDIR'
    fakeError.path = path
    throw fakeError
  }

  const content = []
  Object.keys(mockFiles).forEach((mockedPath) => {
    const childPath = mockedPath.substring(path.length + 1)
    if (
      mockedPath.startsWith(path) &&
      !childPath.includes(pathSeparator) &&
      childPath
    ) {
      content.push(childPath)
    }
  })
  return content
}

fs.mkdirSync = (path, options = {}) => {
  if (options.recursive) {
    makeParentDirs(path)
  }
  // Directories are represented as paths with an "undefined" value
  fs.writeFileSync(path, undefined)
}

fs.rmdirSync = (path, options = {}) => {
  if (!fs.existsSync(path)) {
    const fakeError = new Error(
      `Error: ENOENT: no such file or directory, rmdir '${path}'`
    )
    fakeError.errno = -2
    fakeError.syscall = 'rmdir'
    fakeError.code = 'ENOENT'
    fakeError.path = path
    throw fakeError
  }

  if (mockFiles[path] !== undefined) {
    const fakeError = new Error(
      `Error: ENOTDIR: not a directory, rmdir '${path}'`
    )
    fakeError.errno = -20
    fakeError.syscall = 'rmdir'
    fakeError.code = 'ENOTDIR'
    fakeError.path = path
    throw fakeError
  }

  fs.rmSync(path, options)
}

module.exports = fs
