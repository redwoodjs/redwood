import execa from 'execa'

export const addWebPackages = (webPackages: string[]) => ({
  title: 'Adding required web packages...',
  task: async () => {
    const args = ['workspace', 'web', 'add', ...webPackages]
    await execa('yarn', args)
  },
})

export const addApiPackages = (apiPackages: string[]) => ({
  title: 'Adding required api packages...',
  task: async () => {
    await execa('yarn', ['workspace', 'api', 'add', ...apiPackages])
  },
})

export const installPackages = {
  title: 'Installing packages...',
  task: async () => {
    await execa('yarn', ['install'])
  },
}
