import task from 'tasuku'

import { addTypesReactResolution } from './addTypesReactResolution'

export const command = 'types-react-resolution'
export const description =
  '(v1.0->v1.1) Add @types/react resolution in the root package.json'

export const handler = () => {
  task('Add @types/react resolution', async () => {
    addTypesReactResolution()
  })
}
