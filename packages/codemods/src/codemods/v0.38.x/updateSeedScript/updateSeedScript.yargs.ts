import task from 'tasuku'

import { updateSeedScript } from './updateSeedScript'

export const command = 'update-seed-script'
export const description =
  '(v0.37->v0.38) Moves and updates the seed script to work with prisma 3'

export const handler = () => {
  task('Update seed script part', async ({ setOutput }) => {
    await updateSeedScript()

    const notes = [
      `One more thing...`,
      '',
      `  We added a new seed file added in scripts/seed.{js,ts}.`,
      `  If you have an existing seed file in api/db,`,
      `  be sure to move the logic over.`,
      '',
      `  But if you don't use the seed file in api/db, you can just delete it.`,
      '',
    ].join('\n')

    setOutput(notes)
  })
}
