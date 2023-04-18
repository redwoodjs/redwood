import { getDatabase } from '../../database'
import { restructureSpan } from '../span'

export const span = async (
  _parent: unknown,
  { spanId }: { spanId: string }
) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE id=?;')
  const result = await stmt.get(spanId)
  await stmt.finalize()

  return restructureSpan(result)
}

export const spans = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span;')
  const result = await stmt.all()
  await stmt.finalize()

  return result.map(restructureSpan)
}
