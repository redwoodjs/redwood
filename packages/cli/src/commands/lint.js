import fs from 'fs'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'

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

export const handler = ({ fix }) => {
  const paths = getPaths()
  const webExists = fs.existsSync(paths.web.src)
  const apiExists = fs.existsSync(paths.api.src)
  const options = []

  if (fix) {
    options.push('--fix')
  }
  if (webExists) {
    options.push('web/src')
  }
  if (apiExists) {
    options.push('api/src')
  }

  execa('yarn eslint', options, {
    cwd: paths.base,
    shell: true,
    stdio: 'inherit',
  })
}
