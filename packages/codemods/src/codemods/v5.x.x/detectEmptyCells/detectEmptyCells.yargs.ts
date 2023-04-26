import task from 'tasuku'

import detectEmptyCells from './detectEmptyCells'

export const command = 'detect-empty-cells'

export const description =
  '(v4.x.x->v5.0.0) Detects Cells susceptible to the new Empty behavior and warns'

export const handler = () => {
  task(
    'Detecting Cells susceptible to the new Empty behavior',
    async ({ setError }) => {
      try {
        await detectEmptyCells()
        console.log()
      } catch (e: any) {
        setError(
          'Failed to detect cells susceptible to the new Empty behavior in your project \n' +
            e?.message
        )
      }
    }
  )
}
