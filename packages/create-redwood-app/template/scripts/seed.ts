import type { Prisma } from '@prisma/client'

import { db } from '$api/src/lib/db'

export default async () => {
  try {
    // Change to match your data model and seeding needs
    const data: Prisma.UserExampleCreateInput[] = [
      { name: 'alice', email: 'alice@example.com' },
      { name: 'mark', email: 'mark@example.com' },
      { name: 'jackie', email: 'jackie@example.com' },
      { name: 'bob', email: 'bob@example.com' },
    ]

    // Note: if using PostgreSQL, using `createMany` to insert multiple records is much faster
    // @see: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
    Promise.all(
      data.map(async (userExample: Prisma.UserExampleCreateInput) => {
        const record = await db.userExample.create({
          data: { name: userExample.name, email: userExample.email },
        })
        console.log(record)
      })
    )
  } catch (error) {
    console.warn('Please define your seed data.')
    console.error(error)
  }
}
