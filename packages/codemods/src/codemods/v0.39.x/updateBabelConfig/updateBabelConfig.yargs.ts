import task from 'tasuku'

import { removeBabelConfig } from './updateBabelConfig'

export const command = 'update-babel-config'
export const description = '(v0.38-v0.39) Removes babel config from the project'

export const handler = () => {
  task('Update babel config', async ({ setError }: task.TaskInnerApi) => {
    try {
      await removeBabelConfig()
    } catch (e: any) {
      setError(`Failed to codemod your project \n ${e?.message}`)
    }
  })
}
