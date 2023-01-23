import fs from 'fs'

import opentelemetry from '@opentelemetry/api'
import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { tracerName } from '../telemetry/const'

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
        'https://redwoodjs.com/docs/cli-commands#lint'
      )}`
    )
}

export const handler = async ({ path, fix }) => {
  const tracer = opentelemetry.trace.getTracer(tracerName)
  const handlerSpan = tracer.startSpan(
    'handler',
    undefined,
    opentelemetry.context.active()
  )
  handlerSpan.setAttribute('command', 'lint')
  try {
    const pathString = path?.join(' ')
    const result = await execa(
      'yarn eslint',
      [
        fix && '--fix',
        !pathString && fs.existsSync(getPaths().web.src) && 'web/src',
        !pathString && fs.existsSync(getPaths().web.config) && 'web/config',
        !pathString && fs.existsSync(getPaths().scripts) && 'scripts',
        !pathString && fs.existsSync(getPaths().api.src) && 'api/src',
        pathString,
      ].filter(Boolean),
      {
        cwd: getPaths().base,
        shell: true,
        stdio: 'inherit',
      }
    )
    handlerSpan.end()
    process.exit(result.exitCode)
  } catch (e) {
    handlerSpan.recordException(e)
    handlerSpan.end()
    console.log(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
