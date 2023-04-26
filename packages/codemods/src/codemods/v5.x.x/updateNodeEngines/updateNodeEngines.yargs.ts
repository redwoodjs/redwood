import task from 'tasuku'

import { updateNodeEngines } from './updateNodeEngines'

export const command = 'update-node-engines'

export const description =
  '(v5.x.x->v5.x.x) Changes the structure of your Redwood Project'

export const handler = () => {
  task('Update Node Engines', async ({ setError }: TaskInnerApi) => {
    try {
      await updateNodeEngines()
    } catch (e: any) {
      setError('Failed to codemod your project \n' + e?.message)
    }
  })
}
