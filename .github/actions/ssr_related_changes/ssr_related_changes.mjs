import core from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'

async function main() {
  const branch = process.env.GITHUB_BASE_REF

  // If there is no branch, we're not in a pull request
  if (!branch) {
    core.setOutput('ssr-related-changes', false)
    return
  }

  await exec(`git fetch origin ${branch}`)

  const { stdout } = await getExecOutput(
    `git diff origin/${branch} --name-only`
  )

  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)

  for (const changedFile of changedFiles) {
    console.log('changedFile', changedFile)

    if (
      changedFile.startsWith('tasks/smoke-tests/streaming-ssr') ||
      changedFile.startsWith('tasks/smoke-tests/basePlaywright.config.ts') ||
      changedFile.startsWith('github/actions/ssr_related_changes/') ||
      changedFile.startsWith('packages/internal/') ||
      changedFile.startsWith('packages/project-config/') ||
      changedFile.startsWith('packages/web/') ||
      changedFile.startsWith('packages/router/') ||
      changedFile.startsWith('packages/web-server/') ||
      changedFile.startsWith('packages/vite/')
    ) {
      core.setOutput('ssr-related-changes', true)
      return
    }
  }

  core.setOutput('ssr-related-changes', false)
}

main()
