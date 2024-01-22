/* eslint-env es6, node */
import core from '@actions/core'
import { exec } from '@actions/exec'

const checks = [
  {
    command: 'yarn constraints',
    fix: 'You can fix this by running "yarn constraints --fix"',
  },
  {
    command: 'yarn dedupe --check',
    fix: 'You can fix this by running "yarn dedupe"',
  },
  // {
  //   command:
  //     'yarn workspaces foreach --all --parallel run sort-package-json --check',
  //   fix: 'You can fix this by running "yarn workspaces foreach --parallel dlx sort-package-json"',
  // },
]

for (const { command, fix } of checks) {
  try {
    await exec(command)
    console.log(`"${command}" passed`)
  } catch (_e) {
    core.setFailed(`"${command}" failed`)
    console.log(fix)
  }
}
