#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { cd, fs, os, path, within, $ } from 'zx'

async function main() {
  const TMP_DIR = os.tmpdir()
  const TIMESTAMP = (await $`date +%Y%m%d_%H%M%S`).stdout.trim()
  let CRWA_DIR = path.join(`crwa_${TIMESTAMP}`)

  const projectProvided = !!process.argv[2]

  if (projectProvided) {
    CRWA_DIR = process.argv[2]
  }

  let data = {
    version: '',
    node_modules: [],
  }

  await within(async () => {
    cd(TMP_DIR)

    if (projectProvided) {
      cd(CRWA_DIR)
    } else {
      await $`yarn create redwood-app ${CRWA_DIR} -y`
      cd(CRWA_DIR)
      await $`yarn`
    }

    data.version = (
      await $`jq -r '.devDependencies."@redwoodjs/core"' < package.json`
    ).stdout.trim()

    let stdout = (
      await $`find ./node_modules -mindepth 2 -maxdepth 3 -type d -name node_modules`
    ).stdout
      .trim()
      .split('\n')

    data.node_modules = await batchLines(stdout)
  })

  const dataS = `\

rawData.push(\`${JSON.stringify(data, null, 2)}\`)
`

  await fs.appendFile(new URL(`nmHoistingData.js`, import.meta.url), dataS)
}

main()

// ------------------------
// Helpers
// ------------------------

function batchLines(lines) {
  return lines.reduce(async (objP, line) => {
    const obj = await objP

    let depLines = (await $`find ${line} -name 'package.json'`).stdout
      .trim()
      .split('\n')

    const name = line.match(
      /^\.\/node_modules\/(?<package>.+)\/node_modules$/,
    )[1]
    obj[name] = await batchDepLines(depLines)

    return obj
  }, Promise.resolve({}))
}

function batchDepLines(depLines) {
  return depLines.reduce(async (objP, depLine) => {
    const obj = await objP

    const version = (await $`cat ${depLine} | jq -r .version`).stdout.trim()

    const name = depLine.match(
      /[^\.]+\/node_modules\/(?<package>.+)\/package.json$/,
    )[1]
    obj[name] = version

    return obj
  }, Promise.resolve({}))
}
