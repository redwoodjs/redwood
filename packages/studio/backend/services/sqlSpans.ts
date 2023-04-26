import { getDatabase } from '../database'

export const sqlSpans = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT * FROM sql_spans;')
  const spans = await stmt.all()
  await stmt.finalize()

  return spans.map((span) => restructureSpan(span))
}

export const sqlCount = async (_parent: unknown) => {
  const db = await getDatabase()
  const stmt = await db.prepare('SELECT COUNT(1) FROM sql_spans;')
  const result = await stmt.get()
  await stmt.finalize()

  return result['COUNT(1)']
}

const restructureSpan = (span: any) => {
  const restructuredSpan = {
    id: span.id,
    trace: span.trace,
    parent: span.parent,
    name: span.name,
    kind: span.kind,
    statusCode: span.status_code,
    statusMessage: span.status_message,
    startNano: span.start_nano,
    endNano: span.end_nano,
    durationNano: span.duration_nano,
    events: span.events,
    attributes: span.attributes,
    resources: span.resources,
  }
  return restructuredSpan
}
