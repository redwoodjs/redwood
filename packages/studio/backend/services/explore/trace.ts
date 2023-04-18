import { getDatabase } from '../../database'
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

export const traces = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM span;')
  const result = await stmt.all()
  await stmt.finalize()

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
