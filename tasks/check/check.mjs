/* eslint-env node, es2021 */
import core from '@actions/core'
import { getExecOutput } from '@actions/exec'

import { ok, fix } from '../release/prompts.mjs'

console.log('-'.repeat(80))
const constraintsCheck = 'yarn constraints'
try {
  await getExecOutput(constraintsCheck)
  console.log(ok`${constraintsCheck} passed`)
} catch (_e) {
  core.setFailed(`"${constraintsCheck}" failed`)
  console.log(fix`You can fix this by running ${'yarn constraints --fix'}`)
}

console.log('-'.repeat(80))
const dedupeCheck = 'yarn dedupe --check'
try {
  await getExecOutput(dedupeCheck)
  console.log(ok`${dedupeCheck} passed`)
} catch (_e) {
  core.setFailed(`"${dedupeCheck}" failed`)
  console.log(fix`You can fix this by running ${'yarn dedupe'}`)
}

console.log('-'.repeat(80))
const packageJSONsCheck =
  'yarn workspaces foreach --parallel dlx sort-package-json --check'
try {
  await getExecOutput(packageJSONsCheck, null, { silent: true })
  console.log(ok`${packageJSONsCheck} passed`)
} catch (_e) {
  core.setFailed(`"${packageJSONsCheck}" failed`)
  console.log(
    fix`You can fix this by running ${'yarn workspaces foreach --parallel dlx sort-package-json'}`
  )
}
