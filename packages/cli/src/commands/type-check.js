import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getProject } from '@redwoodjs/structure'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaClient } from '../lib/generatePrismaClient'

export const command = 'type-check [sides..]'
export const aliases = ['tsc', 'tc']
export const description = 'Run a TypeScript compiler check on your project'
export const builder = (yargs) => {
  yargs
    .strict(false) // so that we can forward arguments to tsc
    .positional('sides', {
      default: getProject().sides,
      description: 'Which side(s) to run a typecheck on',
      type: 'array',
    })
    .option('prisma', {
      type: 'boolean',
      default: true,
      description: 'Generate the Prisma client',
    })
    .option('generate', {
      type: 'boolean',
      default: true,
      description: 'Regenerate types within the project',
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      description: 'Print more',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#type-check'
      )}`
    )
}

export const handler = async ({ sides, verbose, prisma, generate }) => {
  /**
   * Check types for the project directory : [web, api]
   */

  const typeCheck = async () => {
    let exitCode = 0
    for (const side of sides) {
      console.log(c.info(`\nRunning type check for ${side}...\n`))
      const cwd = path.join(getPaths().base, side)
      try {
        // -s flag to suppress error output from yarn. For example yarn doc link on non-zero status.
        // Since it'll be printed anyways after the whole execution.
        await execa('yarn', ['-s', 'tsc', '--noEmit', '--skipLibCheck'], {
          stdio: 'inherit',
          shell: true,
          cwd,
        })
      } catch (e) {
        exitCode = e.exitCode ?? 1
      }
    }
    return exitCode
  }

  try {
    if (generate && prisma) {
      await generatePrismaClient({
        verbose: verbose,
        schema: getPaths().api.dbSchema,
      })
    }
    if (generate) {
      await new Listr([
        {
          title: 'Generating types',
          task: () =>
            execa('yarn rw-gen', {
              shell: true,
              stdio: verbose ? 'inherit' : 'ignore',
            }),
        },
      ]).run()
    }

    const exitCode = await typeCheck()
    exitCode > 0 && process.exit(exitCode)
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
