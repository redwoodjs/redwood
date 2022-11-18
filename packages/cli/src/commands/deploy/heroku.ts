import { Listr, ListrContext, ListrRenderer, ListrTaskWrapper } from 'listr2'

import { checkHerokuInstalled } from './modules'

// chck for windows
// check if heroku is installed, if not, install
// login to heroku
// create project with desired opts
// configure config files in project
// deploy to heroku
// add commands to passthrough heroku cli

export type TaskWrapper = ListrTaskWrapper<ListrContext, typeof ListrRenderer>

export const command = 'heroku'
export const description = 'Setup and deploy heroku'

export const HEROKU_OPTIONS = {
  init: {
    describe: 'Initialize heroku deploy',
    type: 'init',
    default: false,
  },
}

export const HEROKU_TASKS = [
  {
    title: 'Initializing heroku deploy',
    task: (_: any, task: TaskWrapper): Listr =>
      task.newListr([
        {
          title: 'Checking for heroku',
          task: checkHerokuInstalled,
        },
      ]),
  },
]

export const builder = (yargs: any) => {
  Object.entries(HEROKU_OPTIONS).forEach(([arg, opts]) =>
    yargs.option(arg, opts)
  )
}

export const handler = async (yargs: any) => {
  const taskOpts = {}
  const tasks = new Listr(HEROKU_TASKS, taskOpts)
  await tasks.run({ ...yargs })
}
