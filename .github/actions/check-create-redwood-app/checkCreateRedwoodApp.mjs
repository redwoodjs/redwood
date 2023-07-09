/* eslint-env node */

import { getInput } from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'

async function main() {
  // Pass for merge queues.
  if (process.env.GITHUB_EVENT_NAME !== 'pull_request') {
    return
  }

  // If the PR has the "crwa-ok" label, just pass.
  const { labels } = JSON.parse(getInput('labels'))
  const hasCRWA_OkLabel = labels.some((label) => label.name === 'crwa-ok')

  if (hasCRWA_OkLabel) {
    console.log('Skipping check because of the "crwa-ok" label')
    return
  }

  // Check if the PR rebuilds the fixture. If it does, that's enough.
  await exec('git fetch origin main')
  console.log()

  const { stdout } = await getExecOutput('git diff origin/main --name-only')
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  const didRebuildJS_Template = changedFiles.some((file) =>
    file.startsWith('packages/create-redwood-app/templates/js')
  )

  if (didRebuildJS_Template) {
    console.log("The create redwood app JS template's been rebuilt")
    return
  }

  // If it doesn't, does it need to be rebuilt? If not, no problem. Otherwise, throw.
  const shouldRebuildJS_Template = changedFiles.some(
    (file) =>
      file.startsWith('packages/create-redwood-app/templates/ts')
  )

  if (!shouldRebuildJS_Template) {
    console.log("The create redwood app JS template doesn't need to be rebuilt")
    return
  }

  process.exitCode = 1

  console.log(
    [
      'This PR changes the create-redwood-app TS template. That usually means the JS template needs to be rebuilt.',
      `If you know that it doesn't, add the "crwa-ok" label. Otherwise, rebuild the JS template and commit the changes:`,
      '',
      '  cd packages/create-redwood-app',
      '  yarn ts-to-js',
      '',
    ].join('\n')
  )
}

main()
