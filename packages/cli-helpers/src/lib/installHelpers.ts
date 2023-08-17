import execa from 'execa'

import { getPaths } from './paths'

export const addWebPackages = (webPackages: string[]) => ({
  title: 'Adding required web packages...',
  task: async () => {
    await execa('yarn', ['add', ...webPackages], { cwd: getPaths().web.base })
  },
})

export const addApiPackages = (apiPackages: string[]) => ({
  title: 'Adding required api packages...',
  task: async () => {
    await execa('yarn', ['add', ...apiPackages], { cwd: getPaths().api.base })
  },
})

export const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', ['install'], { cwd: getPaths().base })
  },
}
