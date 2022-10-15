import { exec, getExecOutput } from '@actions/exec'
import core from '@actions/core'

const branch = process.env.GITHUB_BASE_REF

await exec(`git fetch origin ${branch}`)

const { stdout } = await getExecOutput(`git diff origin/${branch} --name-only`)

const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)

for (const changedFile of changedFiles) {
  if (changedFile.startsWith('docs')) {
    continue
  }

  for (const fileToIgnore of [
    'CHANGELOG.md',
    'CODE_OF_CONDUCT.md',
    'CONTRIBUTING.md',
    'CONTRIBUTORS.md',
    'LICENSE',
    'README.md',
    'SECURITY.md',
  ]) {
    if (changedFile === fileToIgnore) {
      continue
    }
  }

  core.setOutput('only-doc-changes', false)
  process.exit(0)
}

core.setOutput('only-doc-changes', true)
