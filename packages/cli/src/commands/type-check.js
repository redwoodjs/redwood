import path from 'path'

import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
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
  const generateTasks = [
    {
      title: 'Generating redwood types...',
      enabled: () => generate,
      task: () => {
        return execa('yarn rw g types', [], {
          stdio: verbose ? 'inherit' : 'ignore',
          shell: true,
          cwd: getPaths().base,
        })
      },
    },
    {
      title: 'Generating prisma client...',
      task: () => {
        return generatePrismaClient({
          verbose,
          schema: getPaths().api.dbSchema,
        })
      },
      enabled: () => prisma && generate,
      skip: () => {
        if (!sides.includes('api')) {
          return 'Skipping, as no api side present'
        }
      },
    },
  ]

  /**
   * Check typings for the project directory : [web, api]
   */

  const typeChecks = sides.map((side) => {
    const cwd = path.join(getPaths().base, side)
    return {
      title: `Typechecking "${side}"...`,
      task: () => {
        return execa('yarn tsc', ['--noEmit', '--skipLibCheck'], {
          stdio: 'inherit',
          shell: true,
          cwd,
        })
      },
    }
  })

  // Approach here is used to run typechecking of web and api in parallel
  const tasks = new Listr([
    ...generateTasks,
    ...[
      {
        title: 'TypeChecking ...',
        task: () => {
          return new Listr(typeChecks, {
            renderer: VerboseRenderer,
            concurrent: true,
          })
        },
      },
    ],
  ] ,{
    renderer: VerboseRenderer,
  })

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
