/* eslint-env es6, node */
import { getInput } from '@actions/core'

// If the PR has the "fixture-ok" label, just pass.
const { labels } = JSON.parse(getInput('labels'))
const hasFixtureOkLabel = labels.some((label) => label.name === 'fixture-ok')

if (hasFixtureOkLabel) {
  console.log('Skipping check because of the "fixture-ok" label')
} else {
  // Check if the PR rebuilds the fixture. If it does, that's enough.
  const { exec, getExecOutput } = await import('@actions/exec')
  await exec('git fetch origin main')
  const { stdout } = await getExecOutput('git diff origin/main --name-only')
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  const didRebuildFixture = changedFiles.some((file) =>
    file.startsWith('__fixtures__/test-project')
  )

  if (didRebuildFixture) {
    console.log(
      [
        // Empty space here (and in subsequent console logs)
        // because git fetch origin main prints to stdout.
        '',
        "The fixture's been rebuilt",
      ].join('\n')
    )
  } else {
    // If it doesn't, does it need to be rebuilt? If not, no problem. Otherwise, throw.
    const shouldRebuildFixture = changedFiles.some(
      (file) =>
        file.startsWith('packages/cli/src/commands/generate') ||
        file.startsWith('packages/cli/src/commands/setup') ||
        file.startsWith('packages/cli-helpers/src/') ||
        file.startsWith('packages/create-redwood-app/template')
    )

    if (!shouldRebuildFixture) {
      console.log(['', "The fixture doesn't need to be rebuilt"].join('\n'))
    } else {
      console.log(
        [
          '',
          'This PR changes generate or setup commands, or the create-redwood-app template.',
          'That usually means the test-project fixture needs to be rebuilt.',
          `If you know that it doesn't, add the "fixture-ok" label. Otherwise, rebuild the fixture and commit the changes:`,
          '',
          '  yarn build:test-project --rebuild-fixture',
          '',
        ].join('\n')
      )

      process.exitCode = 1
    }
  }
}
