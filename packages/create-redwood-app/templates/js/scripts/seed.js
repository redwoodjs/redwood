import { db } from 'api/src/lib/db'

// Manually apply seeds via the `yarn rw prisma db seed` command.
//
// Seeds automatically run the first time you run the `yarn rw prisma migrate dev`
// command and every time you run the `yarn rw prisma migrate reset` command.
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
      '\n  No seed data, skipping. See scripts/seed.ts to start seeding your database!\n'
    )
  } catch (error) {
    console.error(error)
  }
}
