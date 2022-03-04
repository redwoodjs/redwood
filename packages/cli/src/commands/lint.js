import fs from 'fs'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '../lib'
import c from '../lib/colors'

export const command = 'lint [path..]'
export const description = 'Lint your files'
export const builder = (yargs) => {
  yargs
    .positional('path', {
      description:
        'Specify file(s) or directory(ies) to lint relative to project root',
      type: 'array',
    })
    .option('fix', {
      default: false,
      description: 'Try to fix errors',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#lint'
      )}`
    )
}

export const handler = async ({ path, fix }) => {
  try {
    const pathString = path?.join(' ')
    const result = await execa(
      'yarn eslint',
      [
        fix && '--fix',
        !pathString && fs.existsSync(getPaths().web.src) && 'web/src',
        !pathString && fs.existsSync(getPaths().api.src) && 'api/src',
        pathString,
      ].filter(Boolean),
      {
        cwd: getPaths().base,
        shell: true,
        stdio: 'inherit',
      }
    )
    process.exit(result.exitCode)
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
