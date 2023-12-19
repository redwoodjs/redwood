import { getDatabase } from '../../database'
import { restructureSpan } from '../span'

export const graphqlCount = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    `SELECT COUNT(1) FROM span WHERE
      json_extract(attributes, \'$."graphql.operation.type"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.operation.name"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.operation.document"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.operationName"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.document"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.result"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.error"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.variables"\') IS NOT NULL
    ;`
  )
  const result = await stmt.get()
  await stmt.finalize()

  return result['COUNT(1)']
}

export const graphqlSpans = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    `SELECT * FROM span WHERE
      json_extract(attributes, \'$."graphql.operation.type"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.operation.name"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.operation.document"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.operationName"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.document"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.result"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.error"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.variables"\') IS NOT NULL
    ;`
  )
  const result = await stmt.all()
  await stmt.finalize()

  return result.map((span: any) => {
    return { id: span.id, span: restructureSpan(span) }
  })
}

export const graphqlSpan = async (
  _parent: unknown,
  { spanId }: { spanId: string }
) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    `SELECT * FROM span WHERE
      id = ? AND (
      json_extract(attributes, \'$."graphql.operation.type"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.operation.name"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.operation.document"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.operationName"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.document"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.result"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.error"\') IS NOT NULL
      OR json_extract(attributes, \'$."graphql.execute.variables"\') IS NOT NULL
    );`
  )
  const result = await stmt.get(spanId)
  await stmt.finalize()

  return { id: result.id, span: restructureSpan(result) }
}
