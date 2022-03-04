/* eslint-env node, es2021 */
import core from '@actions/core'
import { exec } from '@actions/exec'

import { ok, fix } from '../release/prompts.mjs'

console.log('-'.repeat(80))
const constraintsCheck = 'yarn constraints'
try {
  await exec(constraintsCheck)
  console.log(ok`${constraintsCheck} passed`)
} catch (_e) {
  core.setFailed(`"${constraintsCheck}" failed`)
  console.log(fix`You can fix this by running ${'yarn constraints --fix'}`)
}

console.log('-'.repeat(80))
const dedupeCheck = 'yarn dedupe --check'
try {
  await exec(dedupeCheck)
  console.log(ok`${dedupeCheck} passed`)
} catch (_e) {
  core.setFailed(`"${dedupeCheck}" failed`)
  console.log(fix`You can fix this by running ${'yarn dedupe'}`)
}

console.log('-'.repeat(80))
const packageJSONsCheck =
  'yarn workspaces foreach --parallel dlx sort-package-json --check'
try {
  // The output from this is just too much.
  await exec(packageJSONsCheck, null, { silent: true })
  console.log(ok`${packageJSONsCheck} passed`)
} catch (_e) {
  core.setFailed(`"${packageJSONsCheck}" failed`)
  console.log(
    fix`You can fix this by running ${'yarn workspaces foreach --parallel dlx sort-package-json'}`
  )
}
