import path from 'path'

import concurrently from 'concurrently'
import execa from 'execa'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getProject } from '@redwoodjs/structure'
import { errorTelemetry } from '@redwoodjs/telemetry'

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
    let conclusiveExitCode = 0

    const tscForAllSides = sides.map((side) => {
      const projectDir = path.join(getPaths().base, side)
      // -s flag to suppress error output from yarn. For example yarn doc link on non-zero status.
      // Since it'll be printed anyways after the whole execution.
      return {
        cwd: projectDir,
        command: `yarn -s tsc --noEmit --skipLibCheck`,
      }
    })

    const { result } = concurrently(tscForAllSides, {
      group: true,
      raw: true,
    })
    try {
      await result
    } catch (err) {
      if (err.length) {
        // Non-null exit codes
        const exitCodes = err.map((e) => e?.exitCode).filter(Boolean)
        conclusiveExitCode = Math.max(...exitCodes)
      }
    }

    return conclusiveExitCode
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
    errorTelemetry(process.argv, e.message)
    console.log(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
