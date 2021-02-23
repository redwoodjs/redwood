/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

dotenv.config()
const db = new PrismaClient()

async function main() {
  // https://www.prisma.io/docs/guides/prisma-guides/seed-database
  // Seed data is database data that needs to exist for your app to run.
  // Ideally this file should be idempotent: running it multiple times
  // will result in the same database state (usually by checking for the
  // existence of a record before trying to create it). For example:
  /*
    const result = await db.user.createMany({
      data: [
        { email: "alice@example.com" },
        { email: "mark@example.com" },
        { email: "jackie@example.com" },
        { email: "bob@example.com" },
      ],
      skipDuplicates: true, // Supported with Postgres database
    })
    console.log(`Created ${result.count} users!`)
  */
  // Note: createMany creates multiple records in a transaction.
  // To enable this feature, add createMany to previewFeatures in your schema.
  // See: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany-preview
  // Note: createMany is not supported by SQLite.
  //
  // Example without createMany (supported by all databases):
  /*
    const existing = await db.user.findMany({ where: { email: 'admin@email.com' }})
    if (!existing.length) {
      await db.user.create({ data: { name: 'Admin', email: 'admin@email.com' }})
    }
  */

  console.info('No data to seed. See api/db/seed.js for info.')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await db.$disconnect()
  })
