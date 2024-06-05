import { db } from 'api/src/lib/db'

// Manually apply seeds via the `yarn rw prisma db seed` command.
// Seeds automatically run with `yarn rw prisma migrate dev` and
// `yarn rw prisma migrate reset` commands.
//
// See https://redwoodjs.com/docs/seeds for more info

export default async () => {
  try {
    const data = []

    for (const item of data) {
      // Create a database record for each item in `data`
      // Example: `await db.product.create({ data: item })`
    }

    console.info(
      'No seed data, skipping. See scripts/seed.ts to start seeding your database!'
    )
  } catch (error) {
    console.error(error)
  }
}
