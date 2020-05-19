import Listr from 'listr'

import { deleteFilesTask, removeRoutesFromRouterTask } from 'src/lib'
import c from 'src/lib/colors'

import {
  files,
  resolveScaffoldPath,
  routes as scaffoldRoutes,
} from '../../generate/scaffold/scaffold'

export const command = 'scaffold <pathSlashModel>'
export const desc = 'Destroy pages, SDL, and a services object.'

export const tasks = ({ model, path }) =>
  new Listr(
    [
      {
        title: 'Destroying scaffold files...',
        task: async () => {
          const f = await files({ model, path })
          return deleteFilesTask(f)
        },
      },
      {
        title: 'Cleaning up scaffold routes...',
        task: async () => {
          const routes = await scaffoldRoutes({ model, path })
          const routeNames = routes.map(extractRouteName)
          return removeRoutesFromRouterTask(routeNames)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

export const handler = async ({ pathSlashModel }) => {
  const t = tasks(resolveScaffoldPath({ pathSlashModel }))
  try {
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}

const extractRouteName = (route) => {
  const { groups } = route.match(/.*name="?(?<routeName>\w+)"?/)
  return groups.routeName
}
