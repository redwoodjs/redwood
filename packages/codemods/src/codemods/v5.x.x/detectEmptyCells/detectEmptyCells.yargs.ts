import task, { TaskInnerAPI } from 'tasuku'

import detectEmptyCells from './detectEmptyCells'

export const command = 'detect-empty-cells'
export const description = '(v4.x.x->v5.0.0) Detects empty cells and warns'

export const handler = () => {
  task('detectEmptyCells', async ({ setError }: TaskInnerAPI) => {
    try {
      await detectEmptyCells()
      console.log()
    } catch (e: any) {
      setError('Failed to detect empty cells in your project \n' + e?.message)
    }
  })
}
