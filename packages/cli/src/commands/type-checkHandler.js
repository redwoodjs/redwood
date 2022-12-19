import path from 'path'

import concurrently from 'concurrently'
import execa from 'execa'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getCmdMajorVersion } from '../commands/upgrade'
import { getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaClient } from '../lib/generatePrismaClient'

export const handler = async ({ sides, verbose, prisma, generate }) => {
  /**
   * Check types for the project directory : [web, api]
   */

  const typeCheck = async () => {
    let conclusiveExitCode = 0

    const yarnVersion = await getCmdMajorVersion('yarn')

    const tscForAllSides = sides.map((side) => {
      const projectDir = path.join(getPaths().base, side)
      // -s flag to suppress error output from yarn. For example yarn doc link on non-zero status.
      // Since it'll be printed anyways after the whole execution.
      return {
        cwd: projectDir,
        command: `yarn ${
          yarnVersion > 1 ? '' : '-s'
        } tsc --noEmit --skipLibCheck`,
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
      await new Listr(
        [
          {
            title: 'Generating types',
            task: () =>
              execa('yarn rw-gen', {
                shell: true,
                stdio: verbose ? 'inherit' : 'ignore',
              }),
          },
        ],
        { renderer: verbose && 'verbose', rendererOptions: { collapse: false } }
      ).run()
    }

    const exitCode = await typeCheck()
    exitCode > 0 && process.exit(exitCode)
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.log(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
