import task from 'tasuku'

import { addDirectives } from './addDirectives'

export const command = 'add-directives'
export const description = '(v0.36->v0.37) Add directives'

export const handler = () => {
  task('Add directives', async () => {
    await addDirectives()
  })
}
