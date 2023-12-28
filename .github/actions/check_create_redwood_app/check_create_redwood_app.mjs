/* eslint-env es6, node */
import { getInput } from '@actions/core'

// If the PR has the "crwa-ok" label, just pass.
const { labels } = JSON.parse(getInput('labels'))
const hasCRWA_OkLabel = labels.some((label) => label.name === 'crwa-ok')

if (hasCRWA_OkLabel) {
  console.log('Skipping check because of the "crwa-ok" label')
} else {
  // Check if the PR rebuilds the fixture. If it does, that's enough.
  const { exec, getExecOutput } = await import('@actions/exec')
  await exec('git fetch origin main')
  const { stdout } = await getExecOutput('git diff origin/main --name-only')
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  const didRebuildJS_Template = changedFiles.some((file) =>
    file.startsWith('packages/create-redwood-app/templates/js')
  )

  if (didRebuildJS_Template) {
    console.log(
      [
        // Empty space here (and in subsequent console logs)
        // because git fetch origin main prints to stdout.
        '',
        "The create redwood app JS template's been rebuilt",
      ].join('\n')
    )
  } else {
    // If it doesn't, does it need to be rebuilt? If not, no problem. Otherwise, throw.
    const shouldRebuildJS_Template = changedFiles.some(
      (file) =>
        file.startsWith('packages/create-redwood-app/templates/ts')
    )

    if (!shouldRebuildJS_Template) {
      console.log(['', "The create redwood app JS template doesn't need to be rebuilt"].join('\n'))
    } else {
      console.log(
        [
          '',
          'This PR changes the create-redwood-app TS template.',
          'That usually means the JS template needs to be rebuilt.',
          `If you know that it doesn't, add the "crwa-ok" label. Otherwise, rebuild the JS template and commit the changes:`,
          '',
          '  cd packages/create-redwood-app',
          '  yarn ts-to-js',
          '',
        ].join('\n')
      )

      process.exitCode = 1
    }
  }
}
