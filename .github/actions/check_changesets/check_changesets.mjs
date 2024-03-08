import { getInput } from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'
import github from '@actions/github'

async function main() {
  // If the PR has the "changesets-ok" label, just pass.
  const { labels } = JSON.parse(getInput('labels'))
  const hasChangesetsOkLabel = labels.some((label) => label.name === 'changesets-ok')
  if (hasChangesetsOkLabel) {
    console.log('Skipping check because of the "changesets-ok" label')
    return
  }

  // Check if the PR adds a changeset.
  await exec('git fetch origin main', [], { silent: true })
  const { stdout } = await getExecOutput('git diff origin/main --name-only', [], { silent: true })
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  const addedChangeset = changedFiles.some((file) => file.startsWith('.changesets/'))
  if (addedChangeset) {
    // Empty space here (and in subsequent `console.log`s) for formatting in the action.
    console.log(
      [
        '',
        "Added a changeset",
      ].join('\n')
    )

    return
  }

  const pr = github.context.payload.pull_request
  console.log(
    [
      '',
      '📝 Consider adding a changeset',
      '==============================',
      '',
      'If this is a user-facing PR (a feature or a fix), it should probably have a changeset.',
      `Run \`yarn changesets ${pr.number}\` to create a changeset for this PR.`,
      "If it doesn't need one (it's a chore), you can add the 'changesets-ok' label.",
    ].join('\n')
  )

  process.exitCode = 1
}

main()
