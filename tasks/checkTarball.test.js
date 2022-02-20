/* eslint-env jest, node, es2021 */
/**
 * Make sure tarballs don't change from under us.
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const fg = require('fast-glob')

/**
 * This line at the end tends to vary:
 *
 * ```
 *  ➤ YN0000: Done in 0s 22ms
 * ```
 *
 * Let's get rid of it before matching.
 *
 * @param {string} workspace
 */
async function getTarballContents(workspace) {
  const child = spawnSync(
    `yarn workspace @redwoodjs/${workspace} pack --dry-run`,
    {
      shell: true,
      cwd: process.env.PROJECT_CWD,
    }
  )

  return child.stdout
    .toString()
    .trim()
    .split('\n')
    .filter((line) => !line.includes('Done in'))
}

const { workspaces: workspacesGlob } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'))
)

const workspaces = fg
  .sync(workspacesGlob, { onlyDirectories: true })
  .map((workspace) => workspace.match(/packages\/(?<name>.+)/).groups.name)

describe('tarballs', () => {
  for (const workspace of workspaces) {
    it(workspace, async () => {
      const tarballContents = await getTarballContents(workspace)
      expect(tarballContents).toMatchSnapshot()
    })
  }
})
