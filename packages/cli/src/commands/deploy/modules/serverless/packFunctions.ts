import path from 'path'

import { nodeFileTrace } from '@vercel/nft'
import fse from 'fs-extra'

import {
  ensurePosixPath,
  getPaths,
  findApiDistFunctions,
} from '@redwoodjs/internal/dist'

import { zipDir } from '../../../../lib'

const ZIPBALL_DIR = './api/dist/zipball'

export async function packFunctions() {
  const filesToBePacked = findApiDistFunctions()
  await Promise.all(filesToBePacked.map(packageSingleFunction))
}

// returns a tuple of [filePath, fileContent]
function generateEntryFile(functionAbsolutePath: string, name: string) {
  const relativeImport = ensurePosixPath(
    path.relative(getPaths().base, functionAbsolutePath)
  )
  return [
    `${ZIPBALL_DIR}/${name}/${name}.js`,
    `module.exports = require('./${relativeImport}')`,
  ]
}

async function packageSingleFunction(functionFile: string) {
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
  zipDir(`${ZIPBALL_DIR}/${functionName}`, `${ZIPBALL_DIR}/${functionName}.zip`)
  await fse.remove(`${ZIPBALL_DIR}/${functionName}`)
  return
}
