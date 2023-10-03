import task from 'tasuku'

import { addMailer } from './addMailer'

export const command = 'add-mailer'
export const description =
  '(v6.x.x->v6.x.x) Adds the boilerplate files/folders needed to configure and use the Redwood mailer'

export const handler = () => {
  task('Add mailer', async () => {
    await addMailer()
  })
}
