/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')

dotenv.config()
const db = new PrismaClient()

async function main() {
  // https://www.prisma.io/docs/guides/prisma-guides/seed-database
  //
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
  // Note: This example use createMany in preview.
  // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany-preview
  // You need to add previewFeatures flag in the api/db/schema.prisma file :
  /*

    generator client {
      provider        = "prisma-client-js"
      previewFeatures = ["createMany"] // add this line
    }

  */

  console.info('No data to seed. See api/db/seed.js for info.')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await db.$disconnect()
  })
