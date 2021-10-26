import task from 'tasuku'

import { udpateSeedScript } from './udpateSeedScript'

export const command = 'update-seed-script'
export const description =
  '(v0.37->v0.38) Moves and updates the seed script to work with prisma 3'

export const handler = () => {
  task('Update seed script part', async () => {
    await udpateSeedScript()
  })
}
