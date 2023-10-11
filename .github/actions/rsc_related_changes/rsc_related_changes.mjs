import core from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'

async function main() {
  const branch = process.env.GITHUB_BASE_REF

  // If there is no branch, we're not in a pull request
  if (!branch) {
    core.setOutput('rsc-related-changes', false)
    return
  }

  await exec(`git fetch origin ${branch}`)

  const { stdout } = await getExecOutput(
    `git diff origin/${branch} --name-only`
  )

  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)

  for (const changedFile of changedFiles) {
    console.log('changedFile', changedFile)

    // As the RSC implementation changes, this list will need to be updated.
    // Also, I could be much more specific here, but then I'd also have to
    // update this list much more often. So this'll serve as a good enough
    // starting point.
    if (
      changedFile.startsWith('tasks/smoke-tests/rsc/') ||
      changedFile.startsWith('tasks/smoke-tests/basePlaywright.config.ts') ||
      changedFile.startsWith('.github/actions/set-up-rsc-project/') ||
      changedFile.startsWith('github/actions/rsc_related_changes/') ||
      changedFile.startsWith('packages/internal/') ||
      changedFile.startsWith('packages/project-config/') ||
      changedFile.startsWith('packages/web/') ||
      changedFile.startsWith('packages/vite/')
    ) {
      core.setOutput('rsc-related-changes', true)
      return
    }
  }

  core.setOutput('rsc-related-changes', false)
}

main()
