import task from 'tasuku'

import { addDirectives } from './addDirectives'

export const command = 'add-directives'
export const description = 'Add directives'

export const handler = () => {
  task('Add directives', async () => {
    await addDirectives()
  })
}
