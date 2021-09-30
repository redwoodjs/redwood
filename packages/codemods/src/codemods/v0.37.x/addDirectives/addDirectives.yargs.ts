import task from 'tasuku'

import { addDirectives } from './addDirectives'

export const command = 'add-directives'
export const description =
  '(v0.36->v0.37) Add the directives directory from create-redwood-app template'

export const handler = () => {
  task('Add directives', async () => {
    await addDirectives()
  })
}
