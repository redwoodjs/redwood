// @ts-check

import fs from 'node:fs'

function main() {
  // `GITHUB_EVENT_PATH` is set in the GitHub Actions runner.
  // It's the path to the file on the runner that contains the full event webhook payload.
  // See https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables.
  const event = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf-8')

  const {
    pull_request: {
      milestone
    }
  } = JSON.parse(event)

  if (milestone) {
    return
  }

  process.exitCode = 1

  console.error([
    "A pull request must have a milestone that indicates where it's supposed to be released:",
    '',
    "- next-release       -- the PR should be released in the next minor (it's a feature)",
    "- next-release-patch -- the PR should be released in the next patch (it's a bug fix or project-side chore)",
    "- v7.0.0             -- the PR should be released in v7.0.0 (it's breaking or builds off a breaking PR)",
    "- chore              -- the PR is a framework-side chore (changes CI, tasks, etc.) and it isn't released, per se",
    '',
    `(If you're still not sure, go with "next-release".)`
  ].join('\n'))
}

main()
