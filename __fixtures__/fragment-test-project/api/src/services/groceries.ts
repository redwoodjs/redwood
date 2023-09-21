import { db } from 'src/lib/db'

const isFruit = (grocery) => {
  return grocery.isSeedless !== null && grocery.ripenessIndicators !== null
}

export const groceries = async () => {
  const result = await db.produce.findMany({
    include: { stall: true },
    orderBy: { name: 'asc' },
  })

  const avail = result.map((grocery) => {
    if (isFruit) {
      return {
        ...grocery,
        __typename: 'Fruit',
        __resolveType: 'Fruit',
      }
    } else {
      return {
        ...grocery,
        __typename: 'Vegetable',
        __resolveType: 'Vegetable',
      }
    }
  })

  return avail
}
