import path from 'path'

import { nodeFileTrace } from '@vercel/nft'
import archiver from 'archiver'
import fse from 'fs-extra'

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
  const functionEntryPromise = fse.outputFile(
    `${ZIPBALL_DIR}/${functionName}/${functionName}.js`,
    `module.exports = require('${functionFile}')`
  )
  copyPromises.push(functionEntryPromise)

  await Promise.all(copyPromises)
  await zipDirectory(
    `${ZIPBALL_DIR}/${functionName}`,
    `${ZIPBALL_DIR}/${functionName}.zip`
  )
  await fse.remove(`${ZIPBALL_DIR}/${functionName}`)
  return
}

async function ntfPack() {
  const filesToBePacked = (await fse.readdir('./api/dist/functions'))
    .filter((path) => path.endsWith('.js'))
    .map((path) => `./api/dist/functions/${path}`)
  return Promise.all(filesToBePacked.map(packageSingleFunction))
}

export default ntfPack
