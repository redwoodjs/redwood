import task from 'tasuku'

import updateJestConfig from './updateJestConfig'

export const command = 'update-jest-config'
export const description =
  '(v0.43->v0.44) Updates jest config to be compatible with third-party tooling'

export const handler = () => {
  task('Updating Jest Configs', async ({ setError }) => {
    try {
      await updateJestConfig()
    } catch (e: any) {
      setError(`Failed to codemod your project \n ${e?.message}`)
    }
  })
}
