/* eslint-env es6, node */

import { getInput } from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'

async function main() {
  // Pass for merge queues.
  if (process.env.GITHUB_EVENT_NAME !== 'pull_request') {
    return
  }

  // If the PR has the "fixture-ok" label, just pass.
  const { labels } = JSON.parse(getInput('labels'))
  const hasFixtureOkLabel = labels.some((label) => label.name === 'fixture-ok')

  if (hasFixtureOkLabel) {
    console.log('Skipping check because of the "fixture-ok" label')
    return
  }

  // Check if the PR rebuilds the fixture. If it does, that's enough.
  await exec('git fetch origin main')
  console.log()

  const { stdout } = await getExecOutput('git diff origin/main --name-only')
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  const didRebuildFixture = changedFiles.some((file) =>
    file.startsWith('__fixtures__/test-project')
  )

  if (didRebuildFixture) {
    console.log("The fixture's been rebuilt")
    return
  }

  // If it doesn't, does it need to be rebuilt? If not, no problem. Otherwise, throw.
  const shouldRebuildFixture = changedFiles.some(
    (file) =>
      file.startsWith('packages/cli/src/commands/generate') ||
      file.startsWith('packages/cli/src/commands/setup') ||
      file.startsWith('packages/cli-helpers/src/') ||
      file.startsWith('packages/create-redwood-app/template') ||
      file.startsWith('packages/auth-providers/dbAuth/setup')
  )

  if (!shouldRebuildFixture) {
    console.log("The fixture doesn't need to be rebuilt")
    return
  }

  process.exitCode = 1

  console.log(
    [
      'This PR changes generate or setup commands, or the create-redwood-app template.',
      'That usually means the test-project fixture needs to be rebuilt.',
      `If you know that it doesn't, add the "fixture-ok" label. Otherwise, rebuild the fixture and commit the changes:`,
      '',
      '  yarn rebuild-test-project-fixture',
      '',
    ].join('\n')
  )
}

main()
