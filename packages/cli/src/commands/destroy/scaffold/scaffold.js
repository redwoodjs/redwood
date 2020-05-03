import Listr from 'listr'

import { deleteFilesTask, removeRoutesFromRouterTask } from 'src/lib'
import c from 'src/lib/colors'

import {
  files,
  routes as scaffoldRoutes,
} from '../../generate/scaffold/scaffold'

export const command = 'scaffold <model>'
export const desc = 'Destroy pages, SDL, and a services object.'

export const handler = async ({ model }) => {
  const tasks = new Listr(
    [
      {
        title: 'Destroying scaffold files...',
        task: async () => {
          const f = await files({ model })
          return deleteFilesTask(f)
        },
      },
      {
        title: 'Cleaning up scaffold routes...',
        task: async () => {
          const routes = await scaffoldRoutes({ model })
          const routeNames = routes.map(extractRouteName)
          return removeRoutesFromRouterTask(routeNames)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )
  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}

const extractRouteName = (route) => {
  const { groups } = route.match(/.*name="?(?<routeName>\w+)"?/)
  return groups.routeName
}
