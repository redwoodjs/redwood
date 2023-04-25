import { getDatabase } from '../database'

export const graphQLSpans = async (_parent: any) => {
  const db = await getDatabase()

  const stmt = await db.prepare(`SELECT * FROM graphql_spans;`)

  const result = await stmt.all()
  await stmt.finalize()

  return result
}

export const graphQLSpanCount = async (_parent: any) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT COUNT(1) FROM graphql_spans;')
  const result = await stmt.get()
  await stmt.finalize()

  return result['COUNT(1)']
}
