import { getDatabase } from '../database'

export const prismaQuerySpans = async (
  _parent: any,
  { id }: { id: string }
) => {
  const db = await getDatabase()

  const stmt = await db.prepare(
    'SELECT * FROM prisma_queries WHERE trace = ? OR parent_trace = ? ORDER BY start_nano asc;'
  )

  const result = await stmt.all(id, id)
  await stmt.finalize()

  return result
}
