import task from 'tasuku'

import upgradeYarn from './upgradeYarn'

export const command = 'upgrade-yarn'
export const description = '(v0.48.x->v0.48.x) Changes the structure of your Redwood Project'

export const handler = () => {
  task('Upgrade Yarn', async ({ setError }: task.TaskInnerApi) => {
    try {
      await upgradeYarn()
    } catch (e: any) {
      setError('Failed to codemod your project \n' + e?.message)
    }
  })
}
