/* eslint-env node, es2021 */

import { Octokit } from 'octokit'

/**
 * Exit with a helpful error message if the user didn't provide a GitHub token.
 */
if (!process.env.GITHUB_TOKEN) {
  console.log(
    [
      '',
      '  You have to provide a GitHub personal-access token (PAT) by setting it to an env var named "GITHUB_TOKEN"',
      '  You can provision a PAT here: https://github.com/settings/tokens',
      '',
    ].join('\n')
  )

  process.exit(1)
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export default octokit
