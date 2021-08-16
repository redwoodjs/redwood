import Listr from 'listr'
import terminalLink from 'terminal-link'

import { deleteFilesTask } from '../../../lib'
import c from '../../../lib/colors'
import { yargsDefaults } from '../../generate'
import { files } from '../../setup/cellStates/cellStates'

export const description = 'Destroy all Cell State components'

const tasks = ({ filesFn, options }) =>
  new Listr(
    [
      {
        title: `Destroying Cell State files...`,
        task: async () => {
          const f = await filesFn({ stories: true, tests: true, ...options })
          return deleteFilesTask(f)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

export const createYargsForCellStateComponentsDestroy = ({
  command,
  filesFn,
  optionsObj = yargsDefaults,
}) => {
  return {
    command,
    description,
    builder: (yargs) => {
      yargs.epilogue(
        `Also see the ${terminalLink(
          'Redwood CLI Reference',
          `https://redwoodjs.com/reference/command-line-interface#destroy-cell-states`
        )}`
      )

      //Add in passed in options
      Object.entries(optionsObj).forEach(([option, config]) => {
        yargs.option(option, config)
      })
    },
    handler: async (options) => {
      const t = tasks({ filesFn, options })
      try {
        await t.run()
      } catch (e) {
        console.log(c.error(e.message))
      }
    },
    tasks,
  }
}

export const { command, builder, handler } =
  createYargsForCellStateComponentsDestroy({
    command: 'cell-states',
    filesFn: files,
    optionsObj: {
      ...yargsDefaults,
      empty: {
        alias: 'e',
        default: true,
        description:
          'Use when you want to generate an Empty cell state component',
        type: 'boolean',
      },
      failure: {
        alias: 'fail',
        default: true,
        description:
          'Use when you want to generate a Failure cell state component',
        type: 'boolean',
      },
      loading: {
        alias: 'l',
        default: true,
        description:
          'Use when you want to generate a Loading cell state component',
        type: 'boolean',
      },
    },
  })
