/* eslint-env node, es2021 */
/**
 * This script runs yarn doctor (`yarn dlx @yarnpkg/doctor`) on a workspace.
 *
 * @remarks
 * While the yarn docs advertise yarn doctor in the context of migrating to PnP,
 * it's good for more than just that.
 * Namely, it helps us make sure that workspaces list their dependencies according to yarn modern's rules.
 * (For example, a package can't require something it doesn't list in its package.json.)
 *
 * We've shipped packages before with missing dependencies and it usually results in broken deploys.
 *
 * @see {@link https://yarnpkg.com/getting-started/migration/#before-we-start}
 * @see {@link https://yarnpkg.com/advanced/rulebook}
 */

import c from 'ansi-colors'
import fg from 'fast-glob'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Instead of hard-coding, dynamically get all the possible workspaces from the workspaces glob
 * in the root package.json.
 *
 * @see {@link https://yarnpkg.com/configuration/manifest#workspaces}
 */
const { workspaces: workspacesGlob } = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
)

const workspaces = fg.sync(workspacesGlob, {
  onlyDirectories: true,
})

/**
 * Yarn sets a few env vars for us, but since we always run this script from the root workspace,
 * `process.env.INIT_CWD` is always === to `process.env.PROJECT_CWD`.
 *
 * So let's set it to the `INIT_CWD` we get from `yarn run check:deps`.
 *
 * @see {@link https://yarnpkg.com/advanced/lifecycle-scripts/#environment-variables}
 * @see {@link https://yarnpkg.com/getting-started/qa/#how-to-share-scripts-between-workspaces}
 */
process.env.INIT_CWD = process.argv[2]

const workspace = path.relative(process.env.PROJECT_CWD, process.env.INIT_CWD)

/**
 * If this script wasn't run from a specific workspace, run it on all of them.
 */
if (workspaces.includes(workspace)) {
  await checkDeps(workspace)
} else {
  await Promise.all(workspaces.map((workspace) => checkDeps(workspace)))
}

/**
 * The implementation.
 *
 * @param {string} workspace
 */
async function checkDeps(workspace) {
  const commonErrorsToIgnore = [
    '➤ YN0000: │ User scripts prefixed with "pre" or "post" (like "prepublishOnly") will not be called in sequence anymore; prefer calling prologues and epilogues explicitly',
    /__testfixtures__/,
  ]

  const errorsToIgnore = {
    'packages/web': [
      ...commonErrorsToIgnore,
      '➤ YN0000: │ /Users/dom/prjcts/rw/redwood/packages/web/dist/entry/index.js:9:46: Undeclared dependency on ~redwood-app-root',
      '➤ YN0000: │ /Users/dom/prjcts/rw/redwood/packages/web/src/entry/index.js:3:1: Undeclared dependency on ~redwood-app-root',
    ],
  }

  const workspaceErrorsToIgnore =
    errorsToIgnore[workspace] || commonErrorsToIgnore

  const ignoreRegExps = workspaceErrorsToIgnore.filter(
    (workspaceErrorToIgnore) => workspaceErrorToIgnore instanceof RegExp
  )

  process.stdout.write(`Checking deps for ${c.green(workspace)}...\n`)

  const child = await spawn(`yarn dlx @yarnpkg/doctor ${workspace}`, {
    shell: true,
  })

  let errorsStart = false
  process.exitCode = 0
  const errorsStartRegExp = new RegExp(`${workspace}/package.json`)
  const errorsEndRegExp = /Completed/

  /**
   * Get all the errors from `yarn dlx @yarnpkg/doctor ${workspace}`'s stdout.
   */
  for await (let chunk of child.stdout) {
    chunk = chunk.toString().trim()

    if (chunk.match(errorsStartRegExp)) {
      errorsStart = true
      continue
    }

    if (!errorsStart) {
      continue
    }

    if (chunk.match(errorsEndRegExp)) {
      break
    }

    if (
      workspaceErrorsToIgnore.includes(chunk) ||
      ignoreRegExps.some((ignoreRegExp) => ignoreRegExp.test(chunk))
    ) {
      continue
    }

    process.stdout.write(chunk)
    process.stdout.write('\n')
    process.exitCode = 1
  }

  if (process.exitCode === 1) {
    process.stdout.write(`Failed with errors for ${c.red(workspace)}\n`)
    return
  }

  process.stdout.write(`Done checking deps for ${c.green(workspace)}\n`)
}
