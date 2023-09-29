import type { QueryResolvers } from 'types/graphql'

import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

const isFruit = { isSeedless: { not: null }, ripenessIndicators: { not: null } }

export const fruits: QueryResolvers['fruits'] = async () => {
  const result = await db.produce.findMany({
    where: { ...isFruit },
    include: { stall: true },
    orderBy: { name: 'asc' },
  })

  logger.debug({ result }, 'frroooooots')

  return result
}

export const fruitById: QueryResolvers['fruitById'] = async ({ id }) => {
  const result = await db.produce.findUnique({
    where: { id, ...isFruit },
    include: { stall: true },
  })

  logger.debug({ result }, 'frroot')

  return result
}
