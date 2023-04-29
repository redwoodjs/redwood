// import { GraphQLError } from 'graphql'

import { getDatabase } from '../../database'
// import { extractFiltersFromString } from '../../lib/filtering'
// import { generateSelectWithFilters } from '../../lib/sql'
import { restructureSpan } from '../span'

export const traceCount = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare(
    'SELECT COUNT(DISINCT trace) AS trace_count FROM span;'
  )
  const result = await stmt.get()
  await stmt.finalize()

  return result['trace_count']
}

export const traces = async (
  _parent: unknown
  // { searchFilter }: { searchFilter?: string }
) => {
  // let filters: any = {}
  // try {
  //   filters = searchFilter ? extractFiltersFromString(searchFilter) : {}
  // } catch (error) {
  //   throw new GraphQLError(error as string)
  // }

  // We cannot only select a subset of spans because we might miss spans which belong to returned traces
  // TODO: We should first get a list of traceIds with the filters and then get all the spans for those traces.
  // delete filters.limit

  const db = await getDatabase()
  // const [sql, sqlFilters] = generateSelectWithFilters('*', 'span', filters)

  // To debug uncomment the following line
  // console.log('traces', sql, { ...sqlFilters })

  const result = await db.all('SELECT * FROM span;')

  const traceIds = [...new Set(result.map((span: any) => span.trace))]
  const traces = []
  for (const traceId of traceIds) {
    const traceSpans = result.filter((span: any) => span.trace === traceId)
    traces.push({
      id: traceId,
      spans: traceSpans.map((span: any) => restructureSpan(span)),
    })
  }

  return traces
}

export const trace = async (
  _parent: unknown,
  { traceId }: { traceId: string }
) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span WHERE trace=?;')
  const result = await stmt.all(traceId)
  await stmt.finalize()

  return {
    id: traceId,
    spans: result.map((span: any) => restructureSpan(span)),
  }
}
