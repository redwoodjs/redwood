import fs from 'fs'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '../lib'

export const command = 'lint'
export const description = 'Lint your files'
export const builder = (yargs) => {
  yargs
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

export const handler = async ({ fix }) => {
  try{
    const result = await execa(
      'yarn eslint',
      [
        fix && '--fix',
        fs.existsSync(getPaths().web.src) && 'web/src',
        fs.existsSync(getPaths().api.src) && 'api/src',
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
