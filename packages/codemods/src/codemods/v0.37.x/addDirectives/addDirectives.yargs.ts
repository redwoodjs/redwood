import task from 'tasuku'

import { addDirectives } from './addDirectives'

export const addDirectivesTask = (task: any) =>
  task('Add directives', async () => {
    await addDirectives()
  })

export const command = 'add-directives'
export const description = 'Add directives'
export const handler = () => addDirectivesTask(task)

export { addDirectivesTask as task }
