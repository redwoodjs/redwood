import type { QueryResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

const isVegetable = { vegetableFamily: { not: null }, isPickled: { not: null } }

export const vegetables: QueryResolvers['vegetables'] = async () => {
  return await db.produce.findMany({
    where: { ...isVegetable },
    include: { stall: true },
    orderBy: { name: 'asc' },
  })
}

export const vegetableById: QueryResolvers['vegetableById'] = async ({
  id,
}) => {
  return await db.produce.findUnique({
    where: { id, ...isVegetable },
    include: { stall: true },
  })
}
