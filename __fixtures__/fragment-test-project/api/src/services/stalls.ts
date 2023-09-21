import type { QueryResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export const stalls: QueryResolvers['stalls'] = async () => {
  const result = await db.stall.findMany({
    include: { produce: true },
    orderBy: { name: 'asc' },
  })

  return result
}

export const stallById: QueryResolvers['stallById'] = async ({ id }) => {
  const result = await db.stall.findUnique({
    where: { id },
    include: { produce: true },
  })

  return result
}
