import core from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'
import { onlyDocsChanged } from './cases/onlydocs.mjs'
import { rscChanged } from './cases/rsc.mjs'
import { ssrChanged } from './cases/ssr.mjs'

async function getChangedFiles(page = 1){
  console.log(`Getting changed files (${page}) for PR ${process.env.GITHUB_BASE_REF}`)
  const changedFiles = []

  // Query the GithHub API to get the changed files in the PR
  const githubToken = process.env.GITHUB_TOKEN
  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${process.env.GITHUB_BASE_REF}/files?per_page=1&page=${page}`
  const resp = await fetch(url, {
    headers: {
      Authorization: githubToken ? `Bearer ${githubToken}` : undefined,
      ['X-GitHub-Api-Version']: '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  })
  console.log({resp})
  const json = await resp.json()
  const files = json.map((file) => file.filename) || []
  console.log({files})

  changedFiles.push(...files)

  const linkHeader = resp.headers.get('link')
  if(linkHeader && linkHeader.includes('rel="next"')){
    const nextChangedFiles = await getChangedFiles(page + 1)
    changedFiles.push(...nextChangedFiles)
  }

  return changedFiles
}

async function main() {
  const branch = process.env.GITHUB_BASE_REF

  // If there's no branch, we're not in a pull request.
  if (!branch) {
    core.setOutput('onlydocs', false)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  const changedFiles = await getChangedFiles()
  console.log(`${changedFiles.length} changed files`)

  const onlyDocs = onlyDocsChanged(changedFiles)
  if(onlyDocs){
    core.setOutput('onlydocs', true)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  core.setOutput('onlydocs', false)
  core.setOutput('rsc', rscChanged(changedFiles))
  core.setOutput('ssr', ssrChanged(changedFiles))
}

main()
