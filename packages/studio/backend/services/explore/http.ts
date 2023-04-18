import { getDatabase } from '../../database'
import { restructureSpan } from '../span'

export const httpCount = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    'SELECT COUNT(1) FROM span WHERE json_extract(attributes, \'$."http.method"\') IS NOT NULL;'
  )
  const result = await stmt.get()
  await stmt.finalize()

  return result['COUNT(1)']
}

export const httpSpans = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    'SELECT * FROM span WHERE json_extract(attributes, \'$."http.method"\') IS NOT NULL;'
  )
  const result = await stmt.all()
  await stmt.finalize()

  return result.map((span: any) => {
    return { id: span.id, span: restructureSpan(span) }
  })
}

export const httpSpan = async (
  _parent: unknown,
  { spanId }: { spanId: string }
) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    'SELECT * FROM span WHERE id=? AND json_extract(attributes, \'$."http.method"\') IS NOT NULL;'
  )
  const result = await stmt.get(spanId)
  await stmt.finalize()

  return {
    id: spanId,
    span: restructureSpan(result),
  }
}
