import os from 'node:os'
import path from 'node:path'

import { exec } from '@actions/exec'
import * as core from '@actions/core'
import { getProject } from '@redwoodjs/structure'

const test_project_path = path.join(
  os.tmpdir(),
  'test-project',
  // ":" is problematic with paths
  new Date().toISOString().split(':').join('-')
)

console.log({
  test_project_path
})

core.setOutput('test_project_path', test_project_path)

await exec(`yarn build:test-project --ts --link ${test_project_path}`)

try {
  if(!getProject(test_project_path).isTypeScriptProject) throw 'Error: Test-project is expected to be TypeScript'
} catch(e) {
  console.error(`\n${e}\nExiting test-project setup.\n`)
  process.exit(1)
}
