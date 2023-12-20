#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { cd, fs, os, path, within, $ } from 'zx'

const TMP_DIR = os.tmpdir()
const TIMESTAMP = getTimestamp()
let CRWA_DIR = path.join(`crwa_${TIMESTAMP}`)

const projectProvided = !!process.argv[2]

if (projectProvided) {
  CRWA_DIR = process.argv[2]
}

let data = {
  version: '',
  hoistedNodeModules: [],
}

await within(async () => {
  cd(TMP_DIR)

  if (!projectProvided) {
    await $`yarn create redwood-app ${CRWA_DIR} -y`
  }

  cd(CRWA_DIR)

  data.version = (
    await $`jq -r '.devDependencies."@redwoodjs/core"' < package.json`
  ).stdout.trim()

  let stdout = (
    await $`find ./node_modules -mindepth 2 -maxdepth 3 -type d -name node_modules`
  ).stdout
    .trim()
    .split('\n')

  data.hoistedNodeModules = await batchLines(stdout)
})

await fs.writeJSON(`hoisting_data_${TIMESTAMP}.json`, data, { spaces: 2 })

// Helpers.

async function batchLines(lines) {
  return lines.reduce(async (objP, line) => {
    const obj = await objP

    let depLines = (await $`find ${line} -name 'package.json'`).stdout
      .trim()
      .split('\n')

    const name = line.match(
      /^\.\/node_modules\/(?<package>.+)\/node_modules$/
    )[1]
    obj[name] = await batchDepLines(depLines)

    return obj
  }, Promise.resolve({}))
}

async function batchDepLines(depLines) {
  return await depLines.reduce(async (objP, depLine) => {
    const obj = await objP

    const version = (await $`cat ${depLine} | jq -r .version`).stdout.trim()

    const name = depLine.match(
      /[^\.]+\/node_modules\/(?<package>.+)\/package.json$/
    )[1]
    obj[name] = version

    return obj
  }, Promise.resolve({}))
}

function getTimestamp() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // January is 0!
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}
