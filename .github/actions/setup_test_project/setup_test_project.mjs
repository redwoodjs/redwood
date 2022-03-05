import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'

import { exec } from '@actions/exec'
import * as core from '@actions/core'

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
  if (
    !fs.existsSync(path.join(test_project_path, 'web/tsconfig.json')) ||
    !fs.existsSync(path.join(test_project_path, 'api/tsconfig.json'))
  ) {
    throw ('Test-project is not TypeScript')
  }
} catch(e) {
  console.log('********************************')
  console.error('\nError: Test-project is expected to be TypeScript\nExiting test-project setup.\n')
  console.log('********************************')
  process.exit(1)
}
