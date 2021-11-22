import task from 'tasuku'

import { removeBabelConfig } from './removeBabelConfig'

export const command = 'remove-babel-config'
export const description = '(v0.38-v0.39) Removes babel config from the project'

export const handler = () => {
  task('Update seed script part', async ({ setOutput }) => {
    await removeBabelConfig()

    // setOutput(notes)
  })
}
