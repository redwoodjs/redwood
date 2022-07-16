import path from 'path'

import { nodeFileTrace } from '@vercel/nft'
import archiver from 'archiver'
import fse from 'fs-extra'

import {
  ensurePosixPath,
  findApiDistFunctions,
  getPaths,
} from '@redwoodjs/internal'

const ZIPBALL_DIR = './api/dist/zipball'

function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 5 } })
  const stream = fse.createWriteStream(out)

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', (err) => reject(err))
      .pipe(stream)

    stream.on('close', () => resolve())
    archive.finalize()
  })
}

// returns a tuple of [filePath, fileContent]
function generateEntryFile(functionAbsolutePath, name) {
  const relativeImport = ensurePosixPath(
    path.relative(getPaths().base, functionAbsolutePath)
  )
  return [
    `${ZIPBALL_DIR}/${name}/${name}.js`,
    `module.exports = require('./${relativeImport}')`,
  ]
}

async function packageSingleFunction(functionFile) {
  const { name: functionName } = path.parse(functionFile)

  const { fileList: functionDependencyFileList } = await nodeFileTrace([
    functionFile,
  ])
  const copyPromises = []
  for (const singleDependencyPath of functionDependencyFileList) {
    copyPromises.push(
      fse.copy(
        './' + singleDependencyPath,
        `${ZIPBALL_DIR}/${functionName}/${singleDependencyPath}`
      )
    )
  }

  const [entryFilePath, content] = generateEntryFile(functionFile, functionName)

  // This generates an "entry" file, that just proxies the actual
  // function that is nested in api/dist/
  const functionEntryPromise = fse.outputFile(entryFilePath, content)
  copyPromises.push(functionEntryPromise)

  await Promise.all(copyPromises)
  await exports.zipDirectory(
    `${ZIPBALL_DIR}/${functionName}`,
    `${ZIPBALL_DIR}/${functionName}.zip`
  )
  await fse.remove(`${ZIPBALL_DIR}/${functionName}`)
  return
}

function nftPack() {
  const filesToBePacked = findApiDistFunctions()
  return Promise.all(filesToBePacked.map(exports.packageSingleFunction))
}

// We do this, so we can spy the functions in the test
// It didn't make sense to separate into different files
const exports = {
  nftPack,
  packageSingleFunction,
  generateEntryFile,
  zipDirectory,
}

export default exports
