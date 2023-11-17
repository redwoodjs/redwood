import core from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'
import { onlyDocsChanged } from './cases/onlydocs.mjs'

async function main() {
  const branch = process.env.GITHUB_BASE_REF

  // If there's no branch, we're not in a pull request.
  if (!branch) {
    core.setOutput('onlydocs', false)
    return
  }

  await exec(`git fetch origin ${branch}`)

  const { stdout } = await getExecOutput(`git diff origin/${branch} --name-only`)
  const changedFiles = stdout.toString().trim().split('\n').filter(Boolean)
  console.log(`${changedFiles.length} changed files`)

  const onlyDocs = onlyDocsChanged(changedFiles)
  if(onlyDocs){
    core.setOutput('onlydocs', true)
    return
  }

  core.setOutput('onlydocs', false)
}

main()
