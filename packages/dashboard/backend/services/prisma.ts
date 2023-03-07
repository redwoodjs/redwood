import { getDatabase } from '../database'

export const prismaQueries = async (_parent: any, { id }: { id: string }) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    'SELECT * FROM prisma_queries where trace = ? or parent_trace = ? order by start_nano asc;;'
  )
  const prismaQueries = await stmt.all(id)
  await stmt.finalize()
  console.debug('prismaQueries ->>>', prismaQueries)
  return prismaQueries
}
