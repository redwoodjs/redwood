import { getInput } from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'
import github from '@actions/github'

async function main() {
  // If the PR has the "changelog-ok" label, just pass.
  const { labels } = JSON.parse(getInput('labels'))
  const hasChangelogOkLabel = labels.some((label) => label.name === 'changelog-ok')
  if (hasChangelogOkLabel) {
    console.log('Skipping check because of the "changelog-ok" label')
    return
  }

  // Check if the PR updates the Changelog.
  await exec('git fetch origin main', [], { silent: true })
  const { stdout } = await getExecOutput('git diff origin/main --name-only', [], { silent: true })
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  const didUpdateChangelog = changedFiles.some((file) => file === 'CHANGELOG.md')
  if (didUpdateChangelog) {
    // Empty space here (and in subsequent `console.log`s) for formatting in the action.
    console.log(
      [
        '',
        "CHANGELOG.md was updated",
      ].join('\n')
    )

    return
  }

  const pr = github.context.payload.pull_request

  // The lines here are long but it's about how they look in GitHub actions, not here.
  // So if you make changes, cross check them with how they actually look in the action.
  console.log(
    [
      '',
      '📝 Update the Changelog',
      '=======================',
      '',
      'Before this PR can be merged, you need to update the Changelog at CHANGELOG.md. Add a bullet point to the Unreleased section at the top of the file in the following format',
      '',
      '```',
      "## Unreleased",
      '',
      "  - PR title (#PR number)",
      '',
      "    Body...",
      '```',
      '',
      `"PR title" and "PR number" should be the title and number of the PR you're working on verbatim. But "Body" shouldn't necessarily be the same. Feel free to use it as a starting point though.`,
      '',
      'In writing the body, explain what this PR means for Redwood users. The more detail the better. E.g., is it a new feature? How do they use it? Code examples go a long way!',
      '',
      "Here are your PR's title, number, and body as a starting point:",
      '',
      '```',
      `- ${pr.title} (#${pr.number})`,
      '',
      `  ${pr.body}`,
      '```',
    ].join('\n')
  )

  process.exitCode = 1
}

main()
